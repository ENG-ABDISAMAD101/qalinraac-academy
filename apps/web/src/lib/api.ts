import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

const ACCESS_KEY = "qa_access_token";
const REFRESH_KEY = "qa_refresh_token";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem("qa_demo_register_name");
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  // FormData must set its own multipart boundary — never force JSON/multipart headers.
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (typeof config.headers.set === "function") {
      config.headers.set("Content-Type", undefined as unknown as string);
    } else {
      delete (config.headers as Record<string, unknown>)["Content-Type"];
    }
  }
  return config;
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken || refreshToken.startsWith("demo")) return null;
  try {
    const { data } = await axios.post<
      ApiSuccess<{ accessToken: string; refreshToken: string }>
    >(`${baseURL}/auth/refresh`, { refreshToken });
    setAuthTokens(data.data.accessToken, data.data.refreshToken);
    return data.data.accessToken;
  } catch {
    clearAuthTokens();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;
    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry ||
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/register") ||
      config.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    config._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    const accessToken = await refreshPromise;
    if (!accessToken) return Promise.reject(error);
    config.headers.Authorization = `Bearer ${accessToken}`;
    return api.request(config);
  },
);

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/** Shape returned by the API (`id`), mapped to frontend `AuthUser` (`_id`). */
type ApiPublicUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions?: string[];
  isActive?: boolean;
  avatarUrl?: string;
  createdAt?: string | Date;
  phone?: string;
  bio?: string;
  username?: string;
  courseLimit?: number;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string | Date;
};

export type AuthUser = {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  phone?: string;
  bio?: string;
  username?: string;
  courseLimit?: number;
  onboardingCompleted?: boolean;
};

export function mapAuthUser(user: ApiPublicUser): AuthUser {
  return {
    _id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : user.createdAt,
    phone: user.phone,
    bio: user.bio,
    username: user.username,
    courseLimit: user.courseLimit ?? 1,
    onboardingCompleted: user.onboardingCompleted,
  };
}

type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

function mapSession(data: {
  user: ApiPublicUser;
  accessToken: string;
  refreshToken: string;
}): AuthSession {
  return {
    user: mapAuthUser(data.user),
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

export function getApiErrorMessage(err: unknown, fallback: string) {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
    if (err.code === "ERR_NETWORK") {
      return "Cannot reach the server. Is the API running?";
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<
    ApiSuccess<{
      user: ApiPublicUser;
      accessToken: string;
      refreshToken: string;
    }>
  >("/auth/login", { email, password });
  return mapSession(data.data);
}

export async function registerRequest(input: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) {
  const { data } = await api.post<
    ApiSuccess<{
      user: ApiPublicUser;
      accessToken: string;
      refreshToken: string;
    }>
  >("/auth/register", {
    email: input.email,
    password: input.password,
    fullName: input.fullName,
    phone: input.phone,
    role: "Student",
  });
  return mapSession(data.data);
}

export async function refreshRequest(refreshToken: string) {
  const { data } = await api.post<
    ApiSuccess<{
      user: ApiPublicUser;
      accessToken: string;
      refreshToken: string;
    }>
  >("/auth/refresh", { refreshToken });
  return mapSession(data.data);
}

export async function logoutRequest(refreshToken: string) {
  await api.post<ApiSuccess<{ loggedOut: boolean }>>("/auth/logout", {
    refreshToken,
  });
}

export async function meRequest() {
  const { data } = await api.get<ApiSuccess<ApiPublicUser>>("/auth/me");
  return mapAuthUser(data.data);
}

export async function enrollmentsMine() {
  const { data } = await api.get<ApiSuccess<unknown[]>>("/enrollments/mine");
  return data.data;
}

export async function certificatesMine() {
  const { data } = await api.get<ApiSuccess<unknown[]>>("/certificates/mine");
  return data.data;
}

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
};

function mapNotification(raw: {
  _id?: string;
  id?: string;
  title?: string;
  body?: string;
  type?: string;
  readAt?: string | Date | null;
  createdAt?: string | Date;
}): AppNotification {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    title: raw.title ?? "Notification",
    body: raw.body ?? "",
    type: raw.type ?? "info",
    read: Boolean(raw.readAt),
    createdAt:
      raw.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : String(raw.createdAt ?? new Date().toISOString()),
  };
}

export async function notificationsList(): Promise<AppNotification[]> {
  const { data } = await api.get<ApiSuccess<unknown[]>>("/notifications");
  const rows = Array.isArray(data.data) ? data.data : [];
  return rows
    .map((row) => mapNotification(row as Parameters<typeof mapNotification>[0]))
    .filter((n) => n.id);
}

export async function markNotificationReadRequest(id: string) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/notifications/${id}/read`,
  );
  return data.data;
}

export async function markAllNotificationsReadRequest() {
  const { data } = await api.post<ApiSuccess<{ updated: boolean }>>(
    "/notifications/read-all",
  );
  return data.data;
}

export async function deleteNotificationRequest(id: string) {
  const { data } = await api.delete<ApiSuccess<{ deleted: boolean }>>(
    `/notifications/${id}`,
  );
  return data.data;
}

export function formatNotificationTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export type StudentDashboardData = {
  continueCourse: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    progressPercent: number;
    description?: string;
  } | null;
  stats: {
    activeCourses: number;
    completedCourses: number;
    certificates: number;
    quizAverage: number | null;
    overallProgress: number;
    streakDays: number;
    completedLessons: number;
    remainingLessons: number;
  };
  learningCourses: {
    id: string;
    courseId: string;
    title: string;
    thumbnailUrl?: string;
    progressPercent: number;
    watched: number;
    total: number;
  }[];
  upcomingQuizzes: {
    id: string;
    title: string;
    courseId: string;
    courseTitle: string;
    lessonTitle?: string;
  }[];
  activity: { range: string; hours: number }[];
  notifications: {
    id: string;
    title: string;
    body: string;
    type: string;
    read: boolean;
    createdAt: string;
  }[];
};

export async function studentDashboardRequest() {
  const { data } = await api.get<ApiSuccess<StudentDashboardData>>(
    "/students/me/dashboard",
  );
  return data.data;
}

export type StudentCourseCard = {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  progressPercent: number;
  status: string;
  instructor?: { id: string; fullName: string; avatarUrl?: string } | null;
};

export async function studentCoursesRequest() {
  const { data } = await api.get<
    ApiSuccess<
      {
        id: string;
        courseId: string;
        status: string;
        progressPercent: number;
        title?: string;
        description?: string;
        thumbnailUrl?: string;
        course?: {
          id: string;
          title: string;
          thumbnailUrl?: string;
          description?: string;
        };
        instructor?: { id: string; fullName: string; avatarUrl?: string } | null;
      }[]
    >
  >("/students/me/courses");
  const rows = Array.isArray(data.data) ? data.data : [];
  return rows.map((row) => ({
    id: row.id,
    courseId: row.courseId,
    title: row.title ?? row.course?.title ?? "Course",
    description: row.description ?? row.course?.description,
    thumbnailUrl: row.thumbnailUrl ?? row.course?.thumbnailUrl,
    progressPercent: row.progressPercent ?? 0,
    status: row.status,
    instructor: row.instructor ?? null,
  })) satisfies StudentCourseCard[];
}

export async function browsePublishedCoursesRequest(_q?: string) {
  const { data } = await api.get<
    ApiSuccess<
      | {
          _id?: string;
          id?: string;
          title: string;
          description?: string;
          thumbnailUrl?: string;
          priceCents?: number;
        }[]
      | {
          items: {
            _id?: string;
            id?: string;
            title: string;
            description?: string;
            thumbnailUrl?: string;
            priceCents?: number;
          }[];
        }
    >
  >("/courses", { params: { status: "published", limit: 50, page: 1 } });

  const rows = Array.isArray(data.data)
    ? data.data
    : Array.isArray(data.data?.items)
      ? data.data.items
      : [];

  return {
    items: rows.map((item) => ({
      id: String(item.id ?? item._id ?? ""),
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
      priceCents: item.priceCents,
    })).filter((c) => c.id),
    total: rows.length,
  };
}

export async function enrollCourseRequest(courseId: string) {
  const { data } = await api.post<ApiSuccess<unknown>>("/enrollments", {
    courseId,
  });
  return data.data;
}

export type StudentLearnData = {
  course: {
    id: string;
    title: string;
    description?: string;
    thumbnailUrl?: string;
  };
  enrollment: { progressPercent: number; status: string };
  modules: {
    id: string;
    title: string;
    order: number;
    lessons: {
      id: string;
      title: string;
      order: number;
      durationMinutes?: number;
      videoUrl?: string;
      content?: string;
      completed: boolean;
    }[];
  }[];
  lessonCount: number;
  completedCount: number;
  quizzes: {
    id: string;
    title: string;
    description?: string;
    lessonId?: string;
    passingScore: number;
    questionCount: number;
  }[];
  assignments: {
    id: string;
    title: string;
    description?: string;
    lessonId?: string;
    maxScore: number;
  }[];
  instructors: { id: string; fullName: string; avatarUrl?: string }[];
};

export async function studentLearnRequest(courseId: string) {
  const { data } = await api.get<ApiSuccess<StudentLearnData>>(
    `/students/me/learn/${courseId}`,
  );
  return data.data;
}

export async function completeLessonRequest(courseId: string, lessonId: string) {
  const { data } = await api.post<ApiSuccess<unknown>>("/progress/complete", {
    courseId,
    lessonId,
  });
  return data.data;
}

export async function getQuizRequest(quizId: string) {
  const { data } = await api.get<
    ApiSuccess<{
      _id?: string;
      id?: string;
      title: string;
      description?: string;
      passingScore: number;
      questions: { prompt: string; options: string[]; points: number }[];
    }>
  >(`/quizzes/${quizId}`);
  return data.data;
}

export async function attemptQuizRequest(quizId: string, answers: number[]) {
  const { data } = await api.post<
    ApiSuccess<{ percent: number; passed: boolean; attempt: unknown }>
  >(`/quizzes/${quizId}/attempt`, { answers });
  return data.data;
}

export async function submitAssignmentRequest(
  assignmentId: string,
  input: { content?: string; fileAssetId?: string },
) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/assignments/${assignmentId}/submit`,
    input,
  );
  return data.data;
}

export async function uploadFileRequest(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<
    ApiSuccess<{
      _id?: string;
      id?: string;
      originalName: string;
      url?: string;
      storage?: "local" | "r2";
    }>
  >("/files/upload", form, { timeout: 120_000 });
  const asset = data.data;
  return {
    id: String(asset.id ?? asset._id ?? ""),
    originalName: asset.originalName,
    url: asset.url,
    storage: asset.storage,
  };
}

export function mediaPublicUrl(pathOrUrl?: string | null) {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl) || pathOrUrl.startsWith("blob:")) {
    return pathOrUrl;
  }
  const origin = baseURL.replace(/\/api\/v1\/?$/, "");
  return `${origin}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export async function updateStudentProfileRequest(input: {
  fullName?: string;
  phone?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
}) {
  const { data } = await api.patch<ApiSuccess<ApiPublicUser>>(
    "/students/me/profile",
    input,
  );
  return mapAuthUser(data.data);
}

export type FeedbackListData = {
  stats: {
    totalAssignments: number;
    totalQuizzes: number;
    approved: number;
    needRevision: number;
    pending: number;
  };
  items: {
    kind: "quiz" | "assignment";
    id: string;
    title: string;
    description?: string;
    courseId: string;
    courseTitle: string;
    status: string;
    createdAt?: string;
  }[];
};

export async function studentFeedbackRequest() {
  const { data } = await api.get<ApiSuccess<FeedbackListData>>(
    "/students/me/feedback",
  );
  return data.data;
}

export async function studentFeedbackQuizRequest(quizId: string) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>(
    `/students/me/feedback/quizzes/${quizId}`,
  );
  return data.data;
}

export async function studentFeedbackAssignmentRequest(assignmentId: string) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>(
    `/students/me/feedback/assignments/${assignmentId}`,
  );
  return data.data;
}

export async function replyAssignmentRequest(
  assignmentId: string,
  body: string,
) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/students/me/feedback/assignments/${assignmentId}/replies`,
    { body },
  );
  return data.data;
}

export async function studentOrdersRequest() {
  const { data } = await api.get<
    ApiSuccess<
      {
        id: string;
        courseTitle: string;
        amountCents: number;
        currency: string;
        status: string;
        method?: string;
        date: string;
      }[]
    >
  >("/students/me/orders");
  return data.data;
}

export type StudentResource = {
  id: string;
  title: string;
  description?: string;
  mimeType: string;
  originalName: string;
  courseId: string;
  courseTitle: string;
  mentor?: { fullName: string; avatarUrl?: string } | null;
  fileAssetId: string;
};

export async function studentResourcesRequest() {
  const { data } = await api.get<
    ApiSuccess<
      {
        id: string;
        title: string;
        description?: string;
        mimeType: string;
        originalName: string;
        courseId: string;
        courseTitle: string;
        mentor?: { fullName: string; avatarUrl?: string } | null;
        uploader?: { fullName: string; avatarUrl?: string } | null;
        fileAssetId?: string;
        file?: { id: string; originalName?: string; mimeType?: string } | null;
      }[]
    >
  >("/students/me/resources");
  return data.data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    mimeType: row.mimeType,
    originalName: row.originalName ?? row.file?.originalName ?? "file",
    courseId: row.courseId,
    courseTitle: row.courseTitle,
    mentor: row.mentor ?? row.uploader ?? null,
    fileAssetId: row.fileAssetId ?? row.file?.id ?? "",
  })) satisfies StudentResource[];
}

export async function certificatesMineTyped() {
  const { data } = await api.get<
    ApiSuccess<
      {
        _id?: string;
        id?: string;
        status: string;
        recipientName?: string;
        fileUrl?: string;
        filePath?: string;
        createdAt?: string;
        courseId?:
          | string
          | { _id?: string; id?: string; title?: string; slug?: string };
      }[]
    >
  >("/certificates/mine");
  return data.data;
}

export async function requestCertificateApi(input: {
  courseId: string;
  recipientName: string;
  declarationAccepted: true;
}) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    "/certificates/request",
    input,
  );
  return data.data;
}

export async function studentSupportListRequest() {
  const { data } = await api.get<
    ApiSuccess<
      {
        id: string;
        subject: string;
        body: string;
        status: string;
        createdAt: string;
      }[]
    >
  >("/students/me/support");
  return data.data;
}

export async function createSupportTicketRequest(input: {
  subject: string;
  body: string;
  attachmentIds?: string[];
}) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    "/students/me/support",
    input,
  );
  return data.data;
}

export function fileDownloadUrl(fileId: string) {
  return `${baseURL}/files/${fileId}/download`;
}

/** Authenticated file download that works for local + R2 (API-proxied). */
export async function downloadFileById(fileId: string, filename?: string) {
  if (!fileId) throw new Error("Missing file id");
  const response = await api.get<Blob>(`/files/${fileId}/download`, {
    responseType: "blob",
    timeout: 120_000,
  });
  const data = response.data;
  const contentType = String(response.headers["content-type"] ?? data.type ?? "");
  if (contentType.includes("application/json")) {
    const text = await data.text();
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } };
      throw new Error(parsed.error?.message || "Download failed");
    } catch (err) {
      if (err instanceof SyntaxError) throw new Error("Download failed");
      throw err;
    }
  }

  const blobUrl = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

export function formatMoney(cents: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

// ——— Instructor portal ———

export type InstructorDashboardData = {
  stats: {
    totalCourses: number;
    publishedCourses: number;
    pendingCourses: number;
    draftCourses?: number;
    rejectedCourses?: number;
    archivedCourses?: number;
    totalStudents: number;
    totalEarnings: number;
    availableBalance: number;
    pendingWithdrawal: number;
  };
  courseLimit: number;
  canCreateCourse: boolean;
  recentCourses: {
    id: string;
    title: string;
    status: string;
    thumbnailUrl?: string;
    createdAt?: string;
  }[];
};

export async function instructorDashboardRequest() {
  const { data } = await api.get<ApiSuccess<InstructorDashboardData>>(
    "/instructors/me/dashboard",
  );
  return data.data;
}

export async function completeInstructorOnboardingRequest() {
  const { data } = await api.post<ApiSuccess<ApiPublicUser>>(
    "/instructors/me/onboarding/complete",
  );
  return mapAuthUser(data.data);
}

export async function updateInstructorProfileRequest(input: {
  fullName?: string;
  phone?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
}) {
  const { data } = await api.patch<ApiSuccess<ApiPublicUser>>(
    "/instructors/me/profile",
    input,
  );
  return mapAuthUser(data.data);
}

export type CourseCategory =
  | "development"
  | "design"
  | "business"
  | "marketing"
  | "it_software"
  | "personal_development"
  | "data_science"
  | "other";

export const COURSE_CATEGORIES: { value: CourseCategory; label: string }[] = [
  { value: "development", label: "Development" },
  { value: "design", label: "Design" },
  { value: "business", label: "Business" },
  { value: "marketing", label: "Marketing" },
  { value: "it_software", label: "IT & Software" },
  { value: "personal_development", label: "Personal Development" },
  { value: "data_science", label: "Data Science" },
  { value: "other", label: "Other" },
];

export function courseCategoryLabel(value?: string | null) {
  if (!value) return "";
  return (
    COURSE_CATEGORIES.find((c) => c.value === value)?.label ??
    value
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export type CourseVisibility = "public" | "private" | "unlisted";

export type LessonContentType =
  | "video"
  | "article"
  | "pdf"
  | "slides"
  | "zip"
  | "external";

export type LessonAttachment = {
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
};

export type InstructorCourse = {
  id: string;
  title: string;
  subtitle?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  status: string;
  level?: string;
  category?: CourseCategory;
  language?: string;
  learningOutcomes?: string[];
  requirements?: string[];
  targetAudience?: string[];
  tags?: string[];
  isFree?: boolean;
  priceCents: number;
  discountPriceCents?: number;
  accessDuration?: "6_months" | "1_year" | "lifetime";
  currency: string;
  visibility?: CourseVisibility;
  thumbnailUrl?: string;
  bannerUrl?: string;
  promoVideoUrl?: string;
  builderStep?: number;
  rejectionReason?: string;
  submittedAt?: string;
  publishedAt?: string;
  students?: number;
  lessons?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type InstructorCourseInput = {
  title?: string;
  subtitle?: string;
  description?: string;
  shortDescription?: string;
  priceCents?: number;
  discountPriceCents?: number;
  accessDuration?: "6_months" | "1_year" | "lifetime";
  currency?: string;
  level?: string;
  category?: CourseCategory;
  language?: string;
  learningOutcomes?: string[];
  requirements?: string[];
  targetAudience?: string[];
  tags?: string[];
  isFree?: boolean;
  visibility?: CourseVisibility;
  thumbnailUrl?: string;
  bannerUrl?: string;
  promoVideoUrl?: string;
  builderStep?: number;
};

export type InstructorLesson = {
  id: string;
  title: string;
  description?: string;
  content?: string;
  contentType?: LessonContentType;
  videoUrl?: string;
  externalUrl?: string;
  attachments?: LessonAttachment[];
  order: number;
  durationMinutes?: number;
  isPreview?: boolean;
  moduleId?: string;
};

export type InstructorModule = {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: InstructorLesson[];
};

export type InstructorCourseDetail = InstructorCourse & {
  curriculum: InstructorModule[];
  discussions: {
    id: string;
    body: string;
    createdAt: string;
    author: {
      id: string;
      fullName: string;
      avatarUrl?: string;
      role?: string;
    } | null;
  }[];
};

export type InstructorCourseChecklist = {
  checklist: {
    basicInfo: boolean;
    description: boolean;
    learningOutcomes: boolean;
    requirements: boolean;
    curriculum: boolean;
    lessons: boolean;
    assessment: boolean;
    pricing: boolean;
  };
  missing: string[];
  canSubmit: boolean;
  completeness?: number;
  counts: {
    modules: number;
    lessons: number;
    quizzes: number;
    assignments: number;
  };
};

export type LessonOrderPayload = {
  lessonId: string;
  moduleId: string;
  order: number;
};

export async function instructorCoursesRequest() {
  const { data } = await api.get<
    ApiSuccess<{
      courseLimit: number;
      canCreateCourse: boolean;
      items: InstructorCourse[];
    }>
  >("/instructors/me/courses");
  return data.data;
}

export async function instructorCreateCourseRequest(
  input: InstructorCourseInput & { title: string },
) {
  const { data } = await api.post<ApiSuccess<InstructorCourse>>(
    "/instructors/me/courses",
    input,
  );
  return data.data;
}

export async function instructorCourseRequest(courseId: string) {
  const { data } = await api.get<ApiSuccess<InstructorCourseDetail>>(
    `/instructors/me/courses/${courseId}`,
  );
  return data.data;
}

export async function instructorUpdateCourseRequest(
  courseId: string,
  input: InstructorCourseInput,
) {
  const { data } = await api.patch<ApiSuccess<InstructorCourse>>(
    `/instructors/me/courses/${courseId}`,
    input,
  );
  return data.data;
}

export async function instructorCourseChecklistRequest(courseId: string) {
  const { data } = await api.get<ApiSuccess<InstructorCourseChecklist>>(
    `/instructors/me/courses/${courseId}/checklist`,
  );
  return data.data;
}

export async function instructorSaveDraftRequest(courseId: string) {
  const { data } = await api.post<ApiSuccess<InstructorCourse>>(
    `/instructors/me/courses/${courseId}/draft`,
  );
  return data.data;
}

export async function instructorSubmitCourseRequest(courseId: string) {
  const { data } = await api.post<ApiSuccess<InstructorCourse>>(
    `/instructors/me/courses/${courseId}/submit`,
  );
  return data.data;
}

export async function instructorRequestUpdateRequest(courseId: string) {
  const { data } = await api.post<ApiSuccess<InstructorCourse>>(
    `/instructors/me/courses/${courseId}/request-update`,
  );
  return data.data;
}

/** Academic / SuperAdmin: approve pending course → Published */
export async function approveCourseRequest(courseId: string) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/courses/${courseId}/publish`,
  );
  return data.data;
}

/** Academic / SuperAdmin: pending → Draft with optional feedback */
export async function requestCourseChangesRequest(
  courseId: string,
  reason?: string,
) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/courses/${courseId}/request-changes`,
    { reason },
  );
  return data.data;
}

export async function instructorAddModuleRequest(
  courseId: string,
  input: { title: string; description?: string; order?: number },
) {
  const { data } = await api.post<ApiSuccess<InstructorModule>>(
    `/instructors/me/courses/${courseId}/modules`,
    input,
  );
  return data.data;
}

export async function instructorUpdateModuleRequest(
  moduleId: string,
  input: { title?: string; description?: string; order?: number },
) {
  const { data } = await api.patch<
    ApiSuccess<Omit<InstructorModule, "lessons">>
  >(`/instructors/me/modules/${moduleId}`, input);
  return data.data;
}

export async function instructorDeleteModuleRequest(moduleId: string) {
  const { data } = await api.delete<ApiSuccess<{ deleted: boolean }>>(
    `/instructors/me/modules/${moduleId}`,
  );
  return data.data;
}

export type InstructorLessonInput = {
  title?: string;
  description?: string;
  content?: string;
  contentType?: LessonContentType;
  videoUrl?: string;
  externalUrl?: string;
  attachments?: LessonAttachment[];
  durationMinutes?: number;
  isPreview?: boolean;
  order?: number;
};

export async function instructorAddLessonRequest(
  courseId: string,
  moduleId: string,
  input: InstructorLessonInput & { title: string },
) {
  const { data } = await api.post<ApiSuccess<InstructorLesson>>(
    `/instructors/me/courses/${courseId}/modules/${moduleId}/lessons`,
    input,
  );
  return data.data;
}

export async function instructorUpdateLessonRequest(
  lessonId: string,
  input: InstructorLessonInput,
) {
  const { data } = await api.patch<ApiSuccess<InstructorLesson>>(
    `/instructors/me/lessons/${lessonId}`,
    input,
  );
  return data.data;
}

export async function instructorDeleteLessonRequest(lessonId: string) {
  const { data } = await api.delete<ApiSuccess<{ deleted: boolean }>>(
    `/instructors/me/lessons/${lessonId}`,
  );
  return data.data;
}

export async function instructorDuplicateLessonRequest(lessonId: string) {
  const { data } = await api.post<ApiSuccess<InstructorLesson>>(
    `/instructors/me/lessons/${lessonId}/duplicate`,
  );
  return data.data;
}

export async function instructorReorderCurriculumRequest(
  courseId: string,
  input: { moduleIds?: string[]; lessonOrders?: LessonOrderPayload[] },
) {
  const { data } = await api.post<ApiSuccess<InstructorCourseDetail>>(
    `/instructors/me/courses/${courseId}/reorder`,
    input,
  );
  return data.data;
}

export async function instructorCourseDiscussReplyRequest(
  courseId: string,
  body: string,
) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/instructors/me/courses/${courseId}/discussions`,
    { body },
  );
  return data.data;
}

export async function instructorCourseLessonsRequest(courseId: string) {
  const { data } = await api.get<
    ApiSuccess<{ items: { id: string; title: string; moduleId: string }[] }>
  >(`/instructors/me/courses/${courseId}/lessons`);
  return data.data;
}

export async function instructorStudentsRequest(q?: string) {
  const { data } = await api.get<
    ApiSuccess<{
      items: {
        id: string;
        studentId: string;
        name: string;
        email: string;
        avatarUrl?: string;
        courseId: string;
        courseTitle: string;
        status: string;
        progress: number;
        enrolledAt?: string;
      }[];
    }>
  >("/instructors/me/students", { params: q ? { q } : undefined });
  return data.data;
}

export async function instructorAssignmentsRequest() {
  const { data } = await api.get<
    ApiSuccess<{
      items: {
        id: string;
        title: string;
        description?: string;
        courseId: string;
        courseTitle: string;
        lessonId?: string;
        lessonTitle?: string;
        maxScore: number;
        createdAt?: string;
      }[];
    }>
  >("/instructors/me/assignments");
  return data.data;
}

export async function instructorCreateAssignmentRequest(input: {
  title: string;
  description?: string;
  courseId: string;
  lessonId: string;
  maxScore?: number;
}) {
  const { data } = await api.post<ApiSuccess<{ id: string }>>(
    "/instructors/me/assignments",
    input,
  );
  return data.data;
}

export async function instructorAssignmentDetailRequest(assignmentId: string) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>(
    `/instructors/me/assignments/${assignmentId}`,
  );
  return data.data;
}

export async function instructorAssignmentReplyRequest(
  assignmentId: string,
  body: string,
) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/instructors/me/assignments/${assignmentId}/discussions`,
    { body },
  );
  return data.data;
}

export async function instructorQuizzesRequest(q?: string) {
  const { data } = await api.get<
    ApiSuccess<{
      items: {
        id: string;
        title: string;
        description?: string;
        courseId: string;
        courseTitle: string;
        questionCount: number;
        passingScore: number;
        attempts: number;
        avgScore: number;
        createdAt?: string;
      }[];
    }>
  >("/instructors/me/quizzes", { params: q ? { q } : undefined });
  return data.data;
}

export async function instructorCreateQuizRequest(input: {
  title: string;
  description?: string;
  courseId: string;
  lessonId?: string;
  passingScore?: number;
  questions: {
    prompt: string;
    options: string[];
    correctIndex: number;
    points?: number;
  }[];
}) {
  const { data } = await api.post<ApiSuccess<{ id: string }>>(
    "/instructors/me/quizzes",
    input,
  );
  return data.data;
}

export async function instructorQuizResultsRequest(quizId: string) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>(
    `/instructors/me/quizzes/${quizId}`,
  );
  return data.data;
}

export type InstructorResource = {
  id: string;
  title: string;
  description?: string;
  mimeType: string;
  originalName: string;
  courseId: string;
  courseTitle: string;
  moduleId?: string;
  moduleTitle?: string;
  lessonId?: string;
  lessonTitle?: string;
  file: {
    id: string;
    originalName: string;
    mimeType: string;
    size?: number;
    url?: string;
  };
  createdAt?: string;
};

export async function instructorResourcesRequest(q?: string) {
  const { data } = await api.get<ApiSuccess<{ items: InstructorResource[] }>>(
    "/instructors/me/resources",
    { params: q ? { q } : undefined },
  );
  return data.data;
}

export async function instructorCourseCurriculumRequest(courseId: string) {
  const { data } = await api.get<
    ApiSuccess<{
      modules: {
        id: string;
        title: string;
        order: number;
        lessons: { id: string; title: string; order: number }[];
      }[];
    }>
  >(`/instructors/me/courses/${courseId}/curriculum`);
  return data.data;
}

export async function instructorCreateResourceRequest(input: {
  title: string;
  description?: string;
  courseId: string;
  moduleId: string;
  lessonId: string;
  fileAssetId: string;
}) {
  const { data } = await api.post<ApiSuccess<InstructorResource>>(
    "/instructors/me/resources",
    input,
  );
  return data.data;
}

export async function instructorDeleteResourceRequest(resourceId: string) {
  const { data } = await api.delete<ApiSuccess<{ ok: boolean }>>(
    `/instructors/me/resources/${resourceId}`,
  );
  return data.data;
}

export async function instructorEarningsRequest(q?: string) {
  const { data } = await api.get<
    ApiSuccess<{
      totalEarnings: number;
      availableBalance: number;
      pendingWithdrawal: number;
      sharePercent: number;
      items: {
        id: string;
        courseTitle: string;
        studentName: string;
        studentEmail: string;
        amountCents: number;
        instructorShareCents: number;
        currency: string;
        paidAt?: string;
      }[];
    }>
  >("/instructors/me/earnings", { params: q ? { q } : undefined });
  return data.data;
}

export async function instructorWithdrawalsRequest(q?: string) {
  const { data } = await api.get<
    ApiSuccess<{
      availableBalance: number;
      items: {
        id: string;
        amountCents: number;
        currency: string;
        paymentMethod?: string;
        status: string;
        note?: string;
        rejectionReason?: string;
        createdAt?: string;
      }[];
    }>
  >("/instructors/me/withdrawals", { params: q ? { q } : undefined });
  return data.data;
}

export async function instructorCreateWithdrawalRequest(input: {
  amountCents: number;
  paymentMethod: "waafi" | "evc_plus" | "zaad" | "bank_transfer";
  note?: string;
}) {
  const { data } = await api.post<ApiSuccess<{ id: string }>>(
    "/instructors/me/withdrawals",
    input,
  );
  return data.data;
}

export async function instructorAgreementsRequest() {
  const { data } = await api.get<
    ApiSuccess<{
      items: {
        id: string;
        courseTitle: string;
        courseDescription?: string;
        description: string;
        fileUrl: string;
        fileName?: string;
        version: string;
        createdAt?: string;
      }[];
    }>
  >("/instructors/me/agreements");
  return data.data;
}

export async function instructorSupportListRequest() {
  const { data } = await api.get<
    ApiSuccess<
      {
        id: string;
        subject: string;
        body: string;
        status: string;
        createdAt: string;
      }[]
    >
  >("/instructors/me/support");
  return data.data;
}

export async function instructorCreateSupportRequest(input: {
  subject: string;
  body: string;
  attachmentIds?: string[];
}) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    "/instructors/me/support",
    input,
  );
  return data.data;
}

/* ─── Academic portal ─────────────────────────────────────────────── */

export type AcademicDashboardData = {
  stats: {
    totalStudents: number;
    totalInstructors: number;
    activeCourses: number;
    draftCourses: number;
    publishedCourses: number;
    pendingCourseReviews: number;
    pendingActivations: number;
    pendingCertificates: number;
  };
  pendingCourseReviews: {
    id: string;
    course: string;
    instructor: string;
    submittedAt: string;
    status: string;
  }[];
  pendingActivations: {
    id: string;
    student: string;
    course: string;
    priceCents: number;
    currency: string;
    requestedAt: string;
    status: string;
  }[];
  pendingCertificates: {
    id: string;
    student: string;
    course: string;
    instructor: string;
    completionDate: string;
    progress: number;
    status: string;
  }[];
};

export async function academicDashboardRequest() {
  const { data } = await api.get<ApiSuccess<AcademicDashboardData>>(
    "/academic/dashboard",
  );
  return data.data;
}

export async function academicStudentsRequest(q?: string) {
  const { data } = await api.get<
    ApiSuccess<
      {
        id: string;
        name: string;
        email: string;
        phone: string;
        courses: number;
        progress: number;
        status: string;
      }[]
    >
  >("/academic/students", { params: q ? { q } : undefined });
  return data.data;
}

export async function academicSearchStudentsRequest(q: string) {
  const { data } = await api.get<
    ApiSuccess<{ id: string; name: string; email: string }[]>
  >("/academic/students/search", { params: { q } });
  return data.data;
}

export async function academicInstructorsRequest(opts?: {
  q?: string;
  filter?: "all" | "active" | "activity";
}) {
  const { data } = await api.get<
    ApiSuccess<{
      instructors: {
        id: string;
        name: string;
        email: string;
        phone: string;
        status: string;
        courses: number;
        students: number;
        performance: number;
      }[];
      activity: {
        id: string;
        instructor: string;
        instructorId: string;
        course: string;
        courseStatus: string;
        students: number;
        progress: number;
        lastActivity: string;
      }[];
    }>
  >("/academic/instructors", { params: opts });
  return data.data;
}

export async function academicInstructorRequest(id: string) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>(
    `/academic/instructors/${id}`,
  );
  return data.data;
}

export async function academicCoursesRequest(status?: string) {
  const { data } = await api.get<
    ApiSuccess<
      {
        id: string;
        title: string;
        instructor: string;
        students: number;
        lessons: number;
        status: string;
        createdAt: string;
        submittedAt?: string;
        priceCents: number;
        currency: string;
      }[]
    >
  >("/academic/courses", {
    params: status && status !== "all" ? { status } : undefined,
  });
  return data.data;
}

export async function academicCourseReviewRequest(courseId: string) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>(
    `/academic/courses/${courseId}/review`,
  );
  return data.data;
}

export async function academicApproveCourseRequest(courseId: string) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/academic/courses/${courseId}/approve`,
  );
  return data.data;
}

export async function academicRequestChangesRequest(
  courseId: string,
  reason?: string,
) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/academic/courses/${courseId}/request-changes`,
    { reason },
  );
  return data.data;
}

export async function academicRejectCourseRequest(
  courseId: string,
  reason: string,
) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/academic/courses/${courseId}/reject`,
    { reason },
  );
  return data.data;
}

export async function academicSetCourseStatusRequest(
  courseId: string,
  status: "draft" | "published",
) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/academic/courses/${courseId}/set-status`,
    { status },
  );
  return data.data;
}

export async function academicActivationsRequest(status?: string) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>[]>>(
    "/academic/activations",
    { params: status && status !== "all" ? { status } : undefined },
  );
  return data.data;
}

export async function academicActivationRequest(id: string) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>(
    `/academic/activations/${id}`,
  );
  return data.data;
}

export async function academicCreateActivationRequest(input: {
  studentId: string;
  courseId: string;
  priceCents: number;
  currency?: string;
}) {
  const { data } = await api.post<ApiSuccess<Record<string, unknown>>>(
    "/academic/activations",
    input,
  );
  return data.data;
}

export async function academicApproveActivationRequest(id: string) {
  const { data } = await api.post<ApiSuccess<Record<string, unknown>>>(
    `/academic/activations/${id}/approve`,
  );
  return data.data;
}

export async function academicRejectActivationRequest(
  id: string,
  reason: string,
) {
  const { data } = await api.post<ApiSuccess<Record<string, unknown>>>(
    `/academic/activations/${id}/reject`,
    { reason },
  );
  return data.data;
}

export async function academicPublishedCoursesRequest() {
  const { data } = await api.get<
    ApiSuccess<
      { id: string; title: string; priceCents: number; currency: string }[]
    >
  >("/academic/courses/published");
  return data.data;
}

export async function academicCertificatesRequest(status?: string) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>[]>>(
    "/academic/certificates",
    { params: status && status !== "all" ? { status } : undefined },
  );
  return data.data;
}

export async function academicCertificateRequest(id: string) {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>(
    `/academic/certificates/${id}`,
  );
  return data.data;
}

export async function academicApproveCertificateRequest(id: string) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/academic/certificates/${id}/approve`,
  );
  return data.data;
}

export async function academicReadyCertificateRequest(id: string) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/academic/certificates/${id}/ready`,
  );
  return data.data;
}

export async function academicRejectCertificateRequest(
  id: string,
  reason: string,
) {
  const { data } = await api.post<ApiSuccess<unknown>>(
    `/academic/certificates/${id}/reject`,
    { reason },
  );
  return data.data;
}

export async function academicAgreementsRequest() {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>[]>>(
    "/academic/agreements",
  );
  return data.data;
}

export async function academicCreateAgreementRequest(input: {
  title: string;
  description: string;
  fileUrl: string;
  fileName?: string;
  version?: string;
  effectiveDate?: string;
  instructorId?: string;
  status?: "draft" | "active" | "archived";
}) {
  const { data } = await api.post<ApiSuccess<Record<string, unknown>>>(
    "/academic/agreements",
    input,
  );
  return data.data;
}

export async function academicUpdateAgreementRequest(
  id: string,
  input: Record<string, unknown>,
) {
  const { data } = await api.patch<ApiSuccess<Record<string, unknown>>>(
    `/academic/agreements/${id}`,
    input,
  );
  return data.data;
}

export async function academicReportsRequest() {
  const { data } = await api.get<ApiSuccess<Record<string, unknown>>>(
    "/academic/reports",
  );
  return data.data;
}

export async function academicUpdateProfileRequest(input: {
  fullName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}) {
  const { data } = await api.patch<ApiSuccess<AuthUser>>(
    "/academic/profile",
    input,
  );
  return data.data;
}

