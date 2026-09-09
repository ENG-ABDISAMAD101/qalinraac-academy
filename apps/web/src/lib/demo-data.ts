/** Demo data so the student UI is fully visible without a live API. */

export const demoStudent = {
  id: "stu-1",
  fullName: "Amina Yusuf",
  email: "amina@qalinraac.local",
  role: "Student" as const,
  avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Amina",
  quizAverage: 86,
  streakDays: 7,
  overallProgress: 32,
  completedLessons: 18,
  remainingLessons: 38,
};

export const demoStatCards = [
  { label: "Active Courses", value: 3, tone: "navy" as const },
  { label: "Completed Courses", value: 1, tone: "lime" as const },
  { label: "Certificates", value: 1, tone: "navy" as const },
  { label: "Quiz Average", value: "86%", tone: "lime" as const },
];

export const demoProgressPills = [
  {
    id: "c1",
    title: "UI/UX Design",
    watched: 2,
    total: 8,
    href: "/student/learn/ui-ux",
  },
  {
    id: "c2",
    title: "Branding",
    watched: 3,
    total: 8,
    href: "/student/learn/branding",
  },
  {
    id: "c3",
    title: "Front End",
    watched: 6,
    total: 12,
    href: "/student/learn/front-end",
  },
];

export const demoContinueWatching = [
  {
    id: "l1",
    courseId: "front-end",
    category: "FRONT END",
    title: "Beginner's Guide to Becoming a Professional Front-End Developer",
    progress: 42,
    thumbnail:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
  },
  {
    id: "l2",
    courseId: "ui-ux",
    category: "UI/UX DESIGN",
    title: "Optimizing User Experience with the Best UI/UX Design",
    progress: 28,
    thumbnail:
      "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&q=80",
  },
];

export const demoLessonsTable = [
  {
    id: "t1",
    date: "25 Jul 2026 · 09:30",
    type: "UI/UX Design",
    desc: "Understand Of UI/UX Design",
    courseId: "ui-ux",
  },
];

export const demoActivity = [
  { range: "1–10 Aug", hours: 4 },
  { range: "11–20 Aug", hours: 9 },
  { range: "21–30 Aug", hours: 6 },
];

export const demoCourses = [
  {
    id: "front-end",
    title: "Professional Front-End Development",
    instructor: "Instructor",
    progress: 50,
    thumbnail:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
  },
  {
    id: "ui-ux",
    title: "UI/UX Design Fundamentals",
    instructor: "Instructor",
    progress: 25,
    thumbnail:
      "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&q=80",
  },
  {
    id: "branding",
    title: "Brand Identity Systems",
    instructor: "Instructor",
    progress: 38,
    thumbnail:
      "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
  },
];

export const demoQuizzes = [
  {
    id: "q1",
    course: "Front End",
    lesson: "CSS Grid Layouts",
    title: "Grid Fundamentals Quiz",
    dueDate: "12 Sep 2026",
  },
  {
    id: "q2",
    course: "UI/UX Design",
    lesson: "User Research",
    title: "Research Methods Check",
    dueDate: "15 Sep 2026",
  },
];

export const demoNotifications = [
  {
    id: "n1",
    actor: "Mohamud Osman",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Mohamud",
    message:
      '📉 You\'re 174 days behind in "Full Stack Software Engineer + AI" — finish one lesson today to catch up.',
    time: "about 16 hours ago",
    read: false,
  },
  {
    id: "n2",
    actor: "Qalinraac Academy",
    avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Qalinraac",
    message: "✅ Course Activated — Front-End Development is now available in My Courses.",
    time: "about 2 hours ago",
    read: false,
  },
  {
    id: "n3",
    actor: "Quiz Coach",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Quiz",
    message: "⏰ Quiz Reminder — Grid Fundamentals Quiz is due soon.",
    time: "about 1 day ago",
    read: false,
  },
  {
    id: "n4",
    actor: "Academic Office",
    avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Academic",
    message: "🎓 Certificate Approved — Brand Identity Systems is ready to download.",
    time: "about 3 days ago",
    read: true,
  },
];

export const demoCertificates = [
  {
    id: "cert1",
    course: "Brand Identity Systems",
    status: "Ready" as const,
    issuedAt: "20 Aug 2026",
  },
];

export const demoCurriculum = {
  title: "Professional Front-End Development",
  completion: 42,
  totalSections: 4,
  totalLessons: 12,
  completedLessons: 5,
  sections: [
    {
      id: "s1",
      title: "Getting Started",
      lessons: [
        { id: "ls1", title: "Welcome & Setup", duration: "8:20", done: true },
        { id: "ls2", title: "Tooling Overview", duration: "12:04", done: true },
      ],
    },
    {
      id: "s2",
      title: "Core HTML & CSS",
      lessons: [
        {
          id: "ls3",
          title: "Semantic HTML",
          duration: "15:10",
          done: true,
          current: true,
        },
        { id: "ls4", title: "CSS Grid Layouts", duration: "18:40", done: false },
        {
          id: "ls5",
          title: "Responsive Patterns",
          duration: "14:00",
          done: false,
        },
      ],
    },
  ],
};
