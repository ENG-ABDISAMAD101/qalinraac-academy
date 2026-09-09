export const demoAdmin = {
  id: "adm-1",
  fullName: "Faisal Hassan",
  email: "admin@qalinraac.local",
  role: "Admin" as const,
  avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Faisal",
  phone: "+252 61 333 4444",
  bio: "Platform operations for Qalinraac Academy.",
  registeredAt: "2025-08-15T00:00:00.000Z",
  /** Super Admin toggle — default off = view-only academic items */
  academicActionsEnabled: false,
};

export const demoAdminStats = {
  totalStudents: 1284,
  totalInstructors: 46,
  totalCourses: 92,
  activeCourses: 61,
  openSupportTickets: 14,
  totalUsers: 1348,
};

export const demoAdminAcademicOverview = {
  pendingCourseReviews: 5,
  pendingActivations: 8,
  pendingCertificates: 3,
};

export type AdminStudentStatus = "Active" | "Disabled";

export const demoAdminStudents = [
  {
    id: "as1",
    name: "Amina Yusuf",
    email: "amina@student.local",
    phone: "+252 61 111 2222",
    status: "Active" as AdminStudentStatus,
    registeredAt: "12 Jan 2026",
  },
  {
    id: "as2",
    name: "Hassan Ali",
    email: "hassan@student.local",
    phone: "+252 61 222 3333",
    status: "Active" as AdminStudentStatus,
    registeredAt: "18 Feb 2026",
  },
  {
    id: "as3",
    name: "Nura Farah",
    email: "nura@student.local",
    phone: "+252 61 333 5555",
    status: "Disabled" as AdminStudentStatus,
    registeredAt: "03 Mar 2026",
  },
  {
    id: "as4",
    name: "Omar Guled",
    email: "omar@student.local",
    phone: "+252 61 444 6666",
    status: "Active" as AdminStudentStatus,
    registeredAt: "22 Apr 2026",
  },
  {
    id: "as5",
    name: "Layla Mohamed",
    email: "layla@student.local",
    phone: "+252 61 555 7777",
    status: "Active" as AdminStudentStatus,
    registeredAt: "01 Sep 2026",
  },
];

export const demoAdminInstructors = [
  {
    id: "ai1",
    name: "Mohamud Osman",
    email: "mohamud@instructor.local",
    phone: "+252 61 700 1001",
    status: "Active",
    totalCourses: 4,
    totalStudents: 312,
  },
  {
    id: "ai2",
    name: "Hodan Abdi",
    email: "hodan@instructor.local",
    phone: "+252 61 700 1002",
    status: "Active",
    totalCourses: 3,
    totalStudents: 198,
  },
  {
    id: "ai3",
    name: "Yasin Noor",
    email: "yasin@instructor.local",
    phone: "+252 61 700 1003",
    status: "Active",
    totalCourses: 1,
    totalStudents: 54,
  },
];

export type AdminCourseStatus =
  | "Published"
  | "Pending"
  | "Rejected"
  | "Archived";

export const demoAdminCourses = [
  {
    id: "ac1",
    title: "Full Stack Software Engineer + AI",
    instructor: "Mohamud Osman",
    students: 286,
    status: "Published" as AdminCourseStatus,
    createdAt: "10 Jan 2026",
  },
  {
    id: "ac2",
    title: "UI Systems for Product Teams",
    instructor: "Hodan Abdi",
    students: 142,
    status: "Published" as AdminCourseStatus,
    createdAt: "22 Feb 2026",
  },
  {
    id: "ac3",
    title: "Brand Identity Foundations",
    instructor: "Hodan Abdi",
    students: 56,
    status: "Pending" as AdminCourseStatus,
    createdAt: "01 Sep 2026",
  },
  {
    id: "ac4",
    title: "Data Analytics Bootcamp",
    instructor: "Yasin Noor",
    students: 0,
    status: "Rejected" as AdminCourseStatus,
    createdAt: "15 Aug 2026",
  },
  {
    id: "ac5",
    title: "Legacy WordPress Track",
    instructor: "Mohamud Osman",
    students: 18,
    status: "Archived" as AdminCourseStatus,
    createdAt: "05 Jun 2025",
  },
];

export type AdminTicketPriority = "Low" | "Medium" | "High" | "Urgent";
export type AdminTicketStatus =
  | "Open"
  | "In Progress"
  | "Waiting for User"
  | "Resolved"
  | "Closed";

export const demoAdminTickets = [
  {
    id: "TK-1042",
    user: "Amina Yusuf",
    userRole: "Student",
    subject: "Video buffering on lesson 3",
    priority: "High" as AdminTicketPriority,
    status: "Open" as AdminTicketStatus,
    createdAt: "08 Sep 2026",
    message:
      "Lesson 3 video keeps buffering after ~30 seconds on mobile Safari.",
    replies: [
      {
        from: "Amina Yusuf",
        body: "Happens on both Wi‑Fi and mobile data.",
        at: "08 Sep 2026 · 09:12",
      },
    ],
  },
  {
    id: "TK-1041",
    user: "Mohamud Osman",
    userRole: "Instructor",
    subject: "Cannot upload assignment PDF",
    priority: "Medium" as AdminTicketPriority,
    status: "In Progress" as AdminTicketStatus,
    createdAt: "07 Sep 2026",
    message: "Upload fails with a generic error when file is over 8MB.",
    replies: [],
  },
  {
    id: "TK-1038",
    user: "Hassan Ali",
    userRole: "Student",
    subject: "Certificate download link expired",
    priority: "Urgent" as AdminTicketPriority,
    status: "Waiting for User" as AdminTicketStatus,
    createdAt: "05 Sep 2026",
    message: "Download link from email returns 403.",
    replies: [
      {
        from: "Faisal Hassan",
        body: "We regenerated the link — please confirm access.",
        at: "06 Sep 2026 · 14:20",
      },
    ],
  },
  {
    id: "TK-1030",
    user: "Hodan Abdi",
    userRole: "Instructor",
    subject: "Student roster export",
    priority: "Low" as AdminTicketPriority,
    status: "Resolved" as AdminTicketStatus,
    createdAt: "28 Aug 2026",
    message: "Need CSV export of enrolled students.",
    replies: [],
  },
  {
    id: "TK-1022",
    user: "Nura Farah",
    userRole: "Student",
    subject: "Login loop after password reset",
    priority: "High" as AdminTicketPriority,
    status: "Closed" as AdminTicketStatus,
    createdAt: "12 Aug 2026",
    message: "Redirected back to login after reset.",
    replies: [],
  },
];

export const demoAdminRecentUsers = [
  {
    id: "ru1",
    name: "Layla Mohamed",
    role: "Student",
    status: "Active",
    registeredAt: "01 Sep 2026",
    href: "/admin/students/as5",
  },
  {
    id: "ru2",
    name: "Yasin Noor",
    role: "Instructor",
    status: "Active",
    registeredAt: "20 Aug 2026",
    href: "/admin/instructors/ai3",
  },
  {
    id: "ru3",
    name: "Omar Guled",
    role: "Student",
    status: "Active",
    registeredAt: "22 Apr 2026",
    href: "/admin/students/as4",
  },
  {
    id: "ru4",
    name: "Nura Farah",
    role: "Student",
    status: "Disabled",
    registeredAt: "03 Mar 2026",
    href: "/admin/students/as3",
  },
];

export const demoAdminReports = {
  students: {
    total: 1284,
    newRegistrations: 48,
    active: 1190,
    completedCourses: 326,
  },
  instructors: {
    total: 46,
    active: 41,
    publishedCourses: 61,
  },
  courses: {
    total: 92,
    active: 61,
    pending: 5,
    archived: 12,
  },
  support: {
    total: 186,
    open: 14,
    closed: 152,
    avgResponseHours: 4.2,
  },
};

export const demoAdminNotifications = [
  {
    id: "an1",
    actor: "Support",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Support",
    message: "🎫 New Support Ticket — Amina Yusuf: Video buffering on lesson 3.",
    time: "about 2 hours ago",
    read: false,
  },
  {
    id: "an2",
    actor: "Registrations",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Reg",
    message: "👤 New Student Registration — Layla Mohamed joined the academy.",
    time: "about 5 hours ago",
    read: false,
  },
  {
    id: "an3",
    actor: "Courses",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Course",
    message:
      "📚 New Course Submission — Brand Identity Foundations awaiting Academic review.",
    time: "about 1 day ago",
    read: true,
  },
  {
    id: "an4",
    actor: "Certificates",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Cert",
    message: "🏅 Certificate Request — Hassan Ali requested a certificate.",
    time: "about 2 days ago",
    read: true,
  },
];
