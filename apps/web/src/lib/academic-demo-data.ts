export const demoAcademic = {
  id: "acad-1",
  fullName: "Fadumo Hassan",
  email: "academic@qalinraac.local",
  role: "Academic" as const,
  avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Fadumo",
  phone: "+252 61 333 4444",
  bio: "Academic operations lead at Qalinraac Academy.",
  registeredAt: "2025-08-01T00:00:00.000Z",
  status: "Active" as const,
};

export const demoAcademicStats = {
  totalStudents: 412,
  totalInstructors: 18,
  activeCourses: 24,
  pendingCourseReviews: 3,
  pendingActivations: 2,
  pendingCertificates: 4,
};

export const demoPendingCourseReviews = [
  {
    id: "pcr1",
    course: "UI Systems for Product Teams",
    instructor: "Mohamud Osman",
    submittedAt: "01 Sep 2026",
    status: "Pending Review",
  },
  {
    id: "pcr2",
    course: "Data Literacy Essentials",
    instructor: "Hodan Abdi",
    submittedAt: "03 Sep 2026",
    status: "Pending Review",
  },
  {
    id: "pcr3",
    course: "Cloud Ops Primer",
    instructor: "Yasin Noor",
    submittedAt: "05 Sep 2026",
    status: "Pending Review",
  },
];

export const demoPendingActivations = [
  {
    id: "pa1",
    student: "Amina Yusuf",
    course: "Full Stack Software Engineer + AI",
    price: 120,
    requestedAt: "06 Sep 2026",
    status: "Pending",
  },
  {
    id: "pa2",
    student: "Hassan Ali",
    course: "Brand Identity Foundations",
    price: 90,
    requestedAt: "07 Sep 2026",
    status: "Pending",
  },
];

export const demoPendingCertificates = [
  {
    id: "pc1",
    student: "Nura Farah",
    course: "Intro to Digital Skills",
    instructor: "Hodan Abdi",
    completionDate: "28 Aug 2026",
    progress: 100,
    certificateNumber: "QA-2026-0142",
    status: "Pending Review",
  },
  {
    id: "pc2",
    student: "Omar Guled",
    course: "Full Stack Software Engineer + AI",
    instructor: "Mohamud Osman",
    completionDate: "02 Sep 2026",
    progress: 100,
    certificateNumber: "QA-2026-0155",
    status: "Pending Review",
  },
];

export const demoAcademicStudents = [
  {
    id: "as1",
    name: "Amina Yusuf",
    email: "amina@qalinraac.local",
    phone: "+252 61 000 1111",
    status: "Active",
    courses: 2,
    progress: 62,
  },
  {
    id: "as2",
    name: "Hassan Ali",
    email: "hassan@qalinraac.local",
    phone: "+252 61 000 2222",
    status: "Active",
    courses: 1,
    progress: 28,
  },
  {
    id: "as3",
    name: "Nura Farah",
    email: "nura@qalinraac.local",
    phone: "+252 61 000 3333",
    status: "Completed",
    courses: 1,
    progress: 100,
  },
];

export const demoAcademicInstructors = [
  {
    id: "ai1",
    name: "Mohamud Osman",
    email: "instructor@qalinraac.local",
    phone: "+252 61 111 2222",
    status: "Active",
    courses: 4,
    students: 128,
    performance: 86,
    published: 2,
    pending: 1,
    rejected: 1,
    archived: 0,
  },
  {
    id: "ai2",
    name: "Hodan Abdi",
    email: "hodan.instructor@qalinraac.local",
    phone: "+252 61 555 6666",
    status: "Active",
    courses: 3,
    students: 74,
    performance: 91,
    published: 2,
    pending: 1,
    rejected: 0,
    archived: 0,
  },
  {
    id: "ai3",
    name: "Yasin Noor",
    email: "yasin.instructor@qalinraac.local",
    phone: "+252 61 777 8888",
    status: "Inactive",
    courses: 1,
    students: 12,
    performance: 64,
    published: 0,
    pending: 1,
    rejected: 0,
    archived: 0,
  },
];

export const demoAcademicCourses = [
  {
    id: "ac1",
    title: "Full Stack Software Engineer + AI",
    instructor: "Mohamud Osman",
    students: 64,
    lessons: 42,
    status: "Published",
    createdAt: "2026-03-12",
  },
  {
    id: "ac2",
    title: "UI Systems for Product Teams",
    instructor: "Mohamud Osman",
    students: 38,
    lessons: 24,
    status: "Pending Review",
    createdAt: "2026-08-01",
  },
  {
    id: "ac3",
    title: "Brand Identity Foundations",
    instructor: "Hodan Abdi",
    students: 0,
    lessons: 12,
    status: "Draft",
    createdAt: "2026-08-20",
  },
  {
    id: "ac4",
    title: "Intro to Cloud Ops",
    instructor: "Mohamud Osman",
    students: 26,
    lessons: 18,
    status: "Rejected",
    createdAt: "2026-06-04",
  },
  {
    id: "ac5",
    title: "Legacy Excel Bootcamp",
    instructor: "Yasin Noor",
    students: 40,
    lessons: 10,
    status: "Archived",
    createdAt: "2025-01-10",
  },
];

export const demoAcademicActivations = [
  ...demoPendingActivations,
  {
    id: "pa3",
    student: "Nura Farah",
    course: "Intro to Digital Skills",
    price: 75,
    requestedAt: "10 Aug 2026",
    status: "Active",
    activationDate: "12 Aug 2026",
    progress: 100,
  },
  {
    id: "pa4",
    student: "Omar Guled",
    course: "Full Stack Software Engineer + AI",
    price: 120,
    requestedAt: "01 Jul 2026",
    status: "Completed",
    activationDate: "03 Jul 2026",
    progress: 100,
  },
];

export const demoAcademicCertificates = [
  ...demoPendingCertificates,
  {
    id: "pc3",
    student: "Sahra Warsame",
    course: "Brand Identity Foundations",
    instructor: "Hodan Abdi",
    completionDate: "15 Jul 2026",
    progress: 100,
    certificateNumber: "QA-2026-0098",
    status: "Ready",
  },
  {
    id: "pc4",
    student: "Liban Dualeh",
    course: "Data Literacy Essentials",
    instructor: "Yasin Noor",
    completionDate: "20 Jul 2026",
    progress: 92,
    certificateNumber: "QA-2026-0101",
    status: "Rejected",
  },
];

export const demoAcademicAgreements = [
  {
    id: "ag1",
    title: "Instructor Agreement 2026",
    version: "v2.1",
    effectiveDate: "01 Jan 2026",
    uploadedBy: "Fadumo Hassan",
    uploadedAt: "28 Dec 2025",
    status: "Active",
  },
  {
    id: "ag2",
    title: "Instructor Agreement 2025",
    version: "v1.4",
    effectiveDate: "01 Jan 2025",
    uploadedBy: "Fadumo Hassan",
    uploadedAt: "20 Dec 2024",
    status: "Archived",
  },
];

export const demoCourseActivity = [
  {
    id: "act1",
    instructor: "Mohamud Osman",
    course: "UI Systems for Product Teams",
    courseStatus: "Pending Review",
    students: 38,
    progress: 0,
    lastActivity: "Submitted for review · 01 Sep 2026",
    type: "Course Submitted",
  },
  {
    id: "act2",
    instructor: "Hodan Abdi",
    course: "Intro to Digital Skills",
    courseStatus: "Published",
    students: 41,
    progress: 74,
    lastActivity: "Student enrollment · 06 Sep 2026",
    type: "Student Enrollment",
  },
];

export const demoAcademicNotifications = [
  {
    id: "an1",
    actor: "Course Pipeline",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Course",
    message: "📚 New Course Submitted — UI Systems for Product Teams awaits review.",
    time: "about 2 hours ago",
    read: false,
  },
  {
    id: "an2",
    actor: "Activations",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Activation",
    message: "🔓 Student Activation Request — Amina Yusuf · Full Stack Software Engineer + AI.",
    time: "about 5 hours ago",
    read: false,
  },
  {
    id: "an3",
    actor: "Certificates",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Cert",
    message: "🎓 Certificate Request — Nura Farah completed Intro to Digital Skills.",
    time: "about 1 day ago",
    read: true,
  },
];

export const demoAcademicReports = {
  students: {
    total: 412,
    active: 318,
    completed: 94,
    avgProgress: 57,
  },
  instructors: {
    total: 18,
    active: 15,
    published: 24,
    pending: 3,
    rejected: 5,
    students: 412,
  },
  courses: {
    total: 42,
    published: 24,
    pending: 3,
    rejected: 5,
    archived: 10,
  },
  certificates: {
    total: 86,
    pending: 4,
    approved: 12,
    ready: 60,
    rejected: 10,
  },
};
