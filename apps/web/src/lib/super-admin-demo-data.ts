export const demoSuperAdmin = {
  id: "sa-1",
  fullName: "Abdirizak Mohamed",
  email: "superadmin@qalinraac.local",
  role: "Super Admin" as const,
  avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Abdirizak",
  phone: "+252 61 000 1111",
  bio: "Platform owner — full system control for Qalinraac Academy.",
  registeredAt: "2025-01-01T00:00:00.000Z",
  accountStatus: "Active",
};

export const demoSuperAdminStats = {
  totalUsers: 1420,
  totalStudents: 1284,
  totalInstructors: 46,
  totalAcademicStaff: 8,
  totalFinanceStaff: 4,
  totalResearchStaff: 6,
  totalAdmins: 5,
  totalCourses: 92,
  activeCourses: 61,
  pendingCourseReviews: 5,
  pendingActivations: 8,
  pendingCertificates: 3,
  totalRevenue: 84250,
  totalExpenses: 21340,
  netProfit: 62910,
  pendingWithdrawals: 3,
  openSupportTickets: 14,
};

export const demoSuperAdminChart = [
  { month: "Apr", users: 980, revenue: 5200 },
  { month: "May", users: 1050, revenue: 6100 },
  { month: "Jun", users: 1120, revenue: 7200 },
  { month: "Jul", users: 1210, revenue: 8800 },
  { month: "Aug", users: 1320, revenue: 10200 },
  { month: "Sep", users: 1420, revenue: 12400 },
];

export const demoSystemActivity = [
  {
    id: "act1",
    actor: "Abdirizak Mohamed",
    action: "Changed Role",
    detail: "Hassan Ali · Student → Instructor",
    time: "12 min ago",
  },
  {
    id: "act2",
    actor: "Faisal Hassan",
    action: "Closed Ticket",
    detail: "TK-1022 · Login loop",
    time: "1 hour ago",
  },
  {
    id: "act3",
    actor: "Sahra Warsame",
    action: "Approved Withdrawal",
    detail: "Hodan Abdi · $300",
    time: "3 hours ago",
  },
  {
    id: "act4",
    actor: "System",
    action: "Course Submitted",
    detail: "Brand Identity Foundations · Pending Review",
    time: "5 hours ago",
  },
  {
    id: "act5",
    actor: "Abdirizak Mohamed",
    action: "Updated Settings",
    detail: "Instructor share → 70%",
    time: "Yesterday",
  },
];

export type PlatformRole =
  | "Student"
  | "Instructor"
  | "Academic"
  | "Finance"
  | "Research"
  | "Admin"
  | "Super Admin";

export const demoPlatformUsers = [
  {
    id: "u1",
    name: "Amina Yusuf",
    email: "amina@student.local",
    role: "Student" as PlatformRole,
    status: "Active",
    registeredAt: "12 Jan 2026",
    lastActive: "08 Sep 2026",
  },
  {
    id: "u2",
    name: "Mohamud Osman",
    email: "mohamud@instructor.local",
    role: "Instructor" as PlatformRole,
    status: "Active",
    registeredAt: "05 Jan 2026",
    lastActive: "08 Sep 2026",
  },
  {
    id: "u3",
    name: "Hodan Academic",
    email: "academic@qalinraac.local",
    role: "Academic" as PlatformRole,
    status: "Active",
    registeredAt: "10 Feb 2025",
    lastActive: "07 Sep 2026",
  },
  {
    id: "u4",
    name: "Sahra Warsame",
    email: "finance@qalinraac.local",
    role: "Finance" as PlatformRole,
    status: "Active",
    registeredAt: "01 Sep 2025",
    lastActive: "08 Sep 2026",
  },
  {
    id: "u5",
    name: "Dr. Yasmin Ali",
    email: "research@qalinraac.local",
    role: "Research" as PlatformRole,
    status: "Active",
    registeredAt: "15 Mar 2025",
    lastActive: "06 Sep 2026",
  },
  {
    id: "u6",
    name: "Faisal Hassan",
    email: "admin@qalinraac.local",
    role: "Admin" as PlatformRole,
    status: "Active",
    registeredAt: "15 Aug 2025",
    lastActive: "08 Sep 2026",
  },
  {
    id: "u7",
    name: "Abdirizak Mohamed",
    email: "superadmin@qalinraac.local",
    role: "Super Admin" as PlatformRole,
    status: "Active",
    registeredAt: "01 Jan 2025",
    lastActive: "08 Sep 2026",
  },
  {
    id: "u8",
    name: "Nura Farah",
    email: "nura@student.local",
    role: "Student" as PlatformRole,
    status: "Disabled",
    registeredAt: "03 Mar 2026",
    lastActive: "20 Aug 2026",
  },
];

export const demoPermissionModules = [
  "Users",
  "Courses",
  "Certificates",
  "Finance",
  "Research",
  "Support",
  "Settings",
  "Integrations",
] as const;

export const demoPermissionActions = [
  "View",
  "Create",
  "Edit",
  "Delete",
  "Approve",
  "Reject",
  "Manage",
] as const;

export type PermissionAction = (typeof demoPermissionActions)[number];
export type PermissionModule = (typeof demoPermissionModules)[number];

export type RoleMatrixItem = {
  id: string;
  name: string;
  description: string;
  users: number;
  permissions: Partial<Record<PermissionModule, PermissionAction[]>>;
};

export const demoRolesMatrix: RoleMatrixItem[] = [
  {
    id: "role-student",
    name: "Student",
    description: "Learn, purchase, request certificates",
    users: 1284,
    permissions: {
      Users: ["View"],
      Courses: ["View"],
      Support: ["Create", "View"],
    },
  },
  {
    id: "role-instructor",
    name: "Instructor",
    description: "Own courses, quizzes, earnings",
    users: 46,
    permissions: {
      Courses: ["View", "Create", "Edit"],
      Finance: ["View"],
      Support: ["Create", "View"],
    },
  },
  {
    id: "role-academic",
    name: "Academic",
    description: "Approvals, activations, certificates",
    users: 8,
    permissions: {
      Courses: ["View", "Approve", "Reject"],
      Certificates: ["View", "Approve", "Reject"],
      Users: ["View"],
    },
  },
  {
    id: "role-finance",
    name: "Finance",
    description: "Revenue, expenses, withdrawals",
    users: 4,
    permissions: {
      Finance: ["View", "Create", "Approve", "Reject"],
      Users: ["View"],
    },
  },
  {
    id: "role-research",
    name: "Research",
    description: "Projects, papers, submissions",
    users: 6,
    permissions: {
      Research: ["View", "Create", "Edit", "Approve", "Reject"],
    },
  },
  {
    id: "role-admin",
    name: "Admin",
    description: "Operations & support",
    users: 5,
    permissions: {
      Users: ["View", "Edit"],
      Support: ["View", "Edit", "Manage"],
      Courses: ["View"],
    },
  },
  {
    id: "role-super",
    name: "Super Admin",
    description: "Full system control",
    users: 1,
    permissions: Object.fromEntries(
      demoPermissionModules.map((m) => [m, [...demoPermissionActions]]),
    ) as Record<PermissionModule, PermissionAction[]>,
  },
];

export const demoSaStudents = [
  {
    id: "sas1",
    name: "Amina Yusuf",
    email: "amina@student.local",
    phone: "+252 61 111 2222",
    status: "Active",
    courses: 2,
    registeredAt: "12 Jan 2026",
  },
  {
    id: "sas2",
    name: "Hassan Ali",
    email: "hassan@student.local",
    phone: "+252 61 222 3333",
    status: "Active",
    courses: 1,
    registeredAt: "18 Feb 2026",
  },
  {
    id: "sas3",
    name: "Nura Farah",
    email: "nura@student.local",
    phone: "+252 61 333 5555",
    status: "Disabled",
    courses: 1,
    registeredAt: "03 Mar 2026",
  },
];

export const demoSaInstructors = [
  {
    id: "sai1",
    name: "Mohamud Osman",
    email: "mohamud@instructor.local",
    courses: 4,
    students: 312,
    earnings: 12600,
    status: "Active",
    agreement: "Signed",
  },
  {
    id: "sai2",
    name: "Hodan Abdi",
    email: "hodan@instructor.local",
    courses: 3,
    students: 198,
    earnings: 8400,
    status: "Active",
    agreement: "Signed",
  },
];

export const demoSaAcademicQueue = {
  pendingCourses: [
    {
      id: "pc1",
      title: "Brand Identity Foundations",
      instructor: "Hodan Abdi",
      submittedAt: "01 Sep 2026",
    },
  ],
  pendingActivations: [
    {
      id: "pa1",
      student: "Omar Guled",
      course: "Full Stack + AI",
      requestedAt: "04 Sep 2026",
    },
  ],
  pendingCertificates: [
    {
      id: "pct1",
      student: "Hassan Ali",
      course: "Full Stack + AI",
      requestedAt: "06 Sep 2026",
    },
  ],
  agreements: [
    {
      id: "ag1",
      instructor: "Yasin Noor",
      version: "v2.1",
      status: "Pending signature",
    },
  ],
};

export const demoSaCourses = [
  {
    id: "sc1",
    title: "Full Stack Software Engineer + AI",
    instructor: "Mohamud Osman",
    students: 286,
    status: "Published",
    createdAt: "10 Jan 2026",
  },
  {
    id: "sc2",
    title: "UI Systems for Product Teams",
    instructor: "Hodan Abdi",
    students: 142,
    status: "Published",
    createdAt: "22 Feb 2026",
  },
  {
    id: "sc3",
    title: "Brand Identity Foundations",
    instructor: "Hodan Abdi",
    students: 0,
    status: "Pending Review",
    createdAt: "01 Sep 2026",
  },
];

export const demoSaCertificates = [
  {
    id: "cert1",
    student: "Hassan Ali",
    course: "Full Stack + AI",
    status: "Pending",
    requestedAt: "06 Sep 2026",
  },
  {
    id: "cert2",
    student: "Amina Yusuf",
    course: "UI Systems",
    status: "Approved",
    requestedAt: "20 Aug 2026",
  },
  {
    id: "cert3",
    student: "Omar Guled",
    course: "Brand Identity",
    status: "Ready",
    requestedAt: "01 Aug 2026",
  },
];

export const demoSaFinance = {
  revenue: 84250,
  expenses: 21340,
  netProfit: 62910,
  instructorSharePct: 70,
  pendingWithdrawals: [
    { id: "w1", instructor: "Mohamud Osman", amount: 400, status: "Pending" },
    { id: "w2", instructor: "Yasin Noor", amount: 150, status: "Pending" },
  ],
  shareholders: [
    { name: "Abdirizak Holdings", share: 40, profit: 25164 },
    { name: "Qalinraac Trust", share: 30, profit: 18873 },
  ],
};

export const demoSaResearch = {
  users: 6,
  projects: [
    {
      id: "rp1",
      title: "Somali EdTech Outcomes",
      lead: "Dr. Yasmin Ali",
      status: "Active",
      papers: 2,
    },
    {
      id: "rp2",
      title: "Mobile Learning Access",
      lead: "Ibrahim Nur",
      status: "Review",
      papers: 1,
    },
  ],
  submissions: [
    {
      id: "rs1",
      title: "LMS Engagement Study",
      author: "Dr. Yasmin Ali",
      status: "Submitted",
      date: "02 Sep 2026",
    },
  ],
};

export const demoSaReports = {
  students: { total: 1284, active: 1190, new: 48 },
  instructors: { total: 46, active: 41, published: 61 },
  courses: { total: 92, active: 61, pending: 5 },
  academic: { reviews: 5, activations: 8, certificates: 3 },
  finance: { revenue: 84250, expenses: 21340, profit: 62910 },
  research: { projects: 12, papers: 28, submissions: 4 },
  support: { open: 14, closed: 152, avgHours: 4.2 },
};

export const demoSaNotifications = [
  {
    id: "sn1",
    actor: "System",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Sys",
    message: "🔐 Security — Rate limit threshold updated for /auth/login.",
    time: "about 1 hour ago",
    read: false,
  },
  {
    id: "sn2",
    actor: "Users",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Users",
    message: "👤 Role change — Hassan Ali promoted to Instructor.",
    time: "about 3 hours ago",
    read: false,
  },
  {
    id: "sn3",
    actor: "Finance",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Fin",
    message: "💸 Withdrawal pending — 3 requests await Finance review.",
    time: "about 1 day ago",
    read: true,
  },
];

export const demoSaTickets = [
  {
    id: "TK-1042",
    user: "Amina Yusuf",
    role: "Student",
    subject: "Video buffering on lesson 3",
    priority: "High",
    status: "Open",
    createdAt: "08 Sep 2026",
  },
  {
    id: "TK-1041",
    user: "Mohamud Osman",
    role: "Instructor",
    subject: "Cannot upload assignment PDF",
    priority: "Medium",
    status: "In Progress",
    createdAt: "07 Sep 2026",
  },
  {
    id: "TK-1038",
    user: "Hassan Ali",
    role: "Student",
    subject: "Certificate download link expired",
    priority: "Urgent",
    status: "Waiting for User",
    createdAt: "05 Sep 2026",
  },
];

export const demoSystemSettings = {
  institutionName: "Qalinraac Academy",
  contactEmail: "hello@qalinraac.academy",
  contactPhone: "+252 61 000 0000",
  language: "English",
  currency: "USD",
  timezone: "Africa/Mogadishu",
  registrationOpen: true,
  publicRole: "Student",
  courseLimitDefault: 1,
  certificateAutoApprove: false,
};

export const demoIntegrations = {
  payments: {
    waafi: { enabled: true, merchantId: "WAAFI-****21" },
    stripe: { enabled: true, publishableKey: "pk_live_****88" },
    instructorSharePct: 70,
    currency: "USD",
  },
  email: {
    provider: "Amazon SES",
    sender: "noreply@qalinraac.academy",
    smtpHost: "email-smtp.us-east-1.amazonaws.com",
    otpEnabled: true,
  },
};

export const demoStorageConfig = {
  provider: "Cloudflare R2",
  bucket: "qalinraac-media",
  region: "auto",
  uploadLimitMb: 200,
  allowedTypes: "PDF, DOCX, PPTX, MP4, ZIP",
  usedGb: 128.4,
  quotaGb: 500,
  cdnDomain: "cdn.qalinraac.academy",
  videoProvider: "R2 + HLS",
};

export const demoSecurityConfig = {
  jwtAccessMinutes: 15,
  jwtRefreshDays: 30,
  sessionIdleMinutes: 60,
  minPasswordLength: 8,
  require2fa: false,
  rateLimitPerMin: 60,
  maxUploadMb: 50,
  allowedIpCidrs: "0.0.0.0/0",
};

export const demoAuditLogs = [
  {
    id: "al1",
    who: "Abdirizak Mohamed",
    action: "Changed Role",
    target: "Hassan Ali",
    oldValue: "Student",
    newValue: "Instructor",
    ip: "41.78.***.12",
    at: "08 Sep 2026 · 10:42",
  },
  {
    id: "al2",
    who: "Abdirizak Mohamed",
    action: "Updated Settings",
    target: "Payment · Instructor share",
    oldValue: "65%",
    newValue: "70%",
    ip: "41.78.***.12",
    at: "07 Sep 2026 · 16:05",
  },
  {
    id: "al3",
    who: "Faisal Hassan",
    action: "Disabled User",
    target: "Nura Farah",
    oldValue: "Active",
    newValue: "Disabled",
    ip: "197.220.***.44",
    at: "06 Sep 2026 · 09:18",
  },
  {
    id: "al4",
    who: "Sahra Warsame",
    action: "Approved Withdrawal",
    target: "Hodan Abdi · $300",
    oldValue: "Pending",
    newValue: "Completed",
    ip: "105.29.***.90",
    at: "05 Sep 2026 · 14:33",
  },
  {
    id: "al5",
    who: "Abdirizak Mohamed",
    action: "Created User",
    target: "research@qalinraac.local",
    oldValue: "—",
    newValue: "Research",
    ip: "41.78.***.12",
    at: "01 Sep 2026 · 11:00",
  },
];
