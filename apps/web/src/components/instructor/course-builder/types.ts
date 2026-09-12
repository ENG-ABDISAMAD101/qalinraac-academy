import type { CourseCategory, InstructorModule } from "@/lib/api";

export const BUILDER_STEPS = [
  { step: 1, label: "Basic Information", hint: "Title, category, thumbnail" },
  { step: 2, label: "Description", hint: "About this course" },
  { step: 3, label: "What You'll Learn", hint: "Learning outcomes" },
  { step: 4, label: "Requirements", hint: "Prerequisites & audience" },
  { step: 5, label: "Curriculum", hint: "Create sections" },
  { step: 6, label: "Lessons", hint: "Add lessons to sections" },
  { step: 7, label: "Assessment", hint: "Managed on Quizzes / Assignments" },
  { step: 8, label: "Intro Video", hint: "YouTube trailer URL" },
  { step: 9, label: "Pricing", hint: "Price & access duration" },
  { step: 10, label: "Course Preview", hint: "Review & submit" },
] as const;

export const TOTAL_STEPS = BUILDER_STEPS.length;

export type BuilderStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type AccessDuration = "6_months" | "1_year" | "lifetime";

export function clampStep(value: unknown): BuilderStepNumber {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(TOTAL_STEPS, Math.max(1, Math.round(n))) as BuilderStepNumber;
}

export type CourseDraft = {
  title: string;
  description: string;
  category: CourseCategory | "";
  language: "en" | "so" | string;
  level: string;
  learningOutcomes: string[];
  requirements: string[];
  targetAudience: string[];
  isFree: boolean;
  priceCents: number;
  accessDuration: AccessDuration;
  currency: string;
  thumbnailUrl: string;
  promoVideoUrl: string;
};

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type StepProps = {
  courseId: string;
  draft: CourseDraft;
  setDraft: (patch: Partial<CourseDraft>) => void;
  readOnly: boolean;
  curriculum: InstructorModule[];
  reloadCurriculum: () => Promise<void>;
};

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "so", label: "Somali" },
];

export const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const ACCESS_DURATIONS: {
  value: AccessDuration;
  label: string;
}[] = [
  { value: "6_months", label: "6 Months" },
  { value: "1_year", label: "1 Year" },
  { value: "lifetime", label: "Lifetime" },
];

export function levelLabel(value?: string) {
  if (!value) return "";
  return (
    LEVELS.find((l) => l.value === value)?.label ??
    value.charAt(0).toUpperCase() + value.slice(1)
  );
}

/** Instructor-facing label: Draft | In Progress | Published */
export function courseStatusLabel(status: string, displayStatus?: string) {
  if (
    displayStatus === "Published" ||
    displayStatus === "Draft" ||
    displayStatus === "In Progress"
  ) {
    return displayStatus;
  }
  if (status === "published") return "Published";
  if (status === "in_progress" || status === "pending_review") {
    return "In Progress";
  }
  return "Draft";
}

export function sectionLabel(index: number) {
  return `Section ${String(index + 1).padStart(2, "0")}`;
}

export const MISSING_LABELS: Record<string, string> = {
  title: "Course title",
  description: "Course description",
  category: "Category",
  language: "Language",
  level: "Level",
  learningOutcomes: "Learning outcomes",
  modules: "At least one section",
  lessons: "At least one lesson",
};

export const MISSING_STEP: Record<string, BuilderStepNumber> = {
  title: 1,
  category: 1,
  language: 1,
  level: 1,
  basicInfo: 1,
  description: 2,
  learningOutcomes: 3,
  requirements: 4,
  modules: 5,
  curriculum: 5,
  lessons: 6,
  assessment: 7,
  introVideo: 8,
  pricing: 9,
};
