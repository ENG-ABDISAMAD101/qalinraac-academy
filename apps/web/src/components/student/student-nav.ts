import {
  Award,
  Bell,
  BookOpen,
  FolderOpen,
  HeadphonesIcon,
  Home,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type StudentNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  keywords?: string[];
};

/** Public home first, then student portal navigation. */
export const STUDENT_COMMAND_PAGES: StudentNavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    keywords: ["site", "landing", "marketing"],
  },
  {
    href: "/student/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    keywords: ["overview", "home"],
  },
  {
    href: "/student/courses",
    label: "My Courses",
    icon: BookOpen,
    keywords: ["learn", "enrolled"],
  },
  {
    href: "/student/feedback",
    label: "Feedback & Discussions",
    icon: MessageSquare,
    keywords: ["assignment", "quiz", "discussion"],
  },
  {
    href: "/student/resources",
    label: "Resources",
    icon: FolderOpen,
    keywords: ["files", "pdf", "download"],
  },
  {
    href: "/student/certificates",
    label: "Certificates",
    icon: Award,
    keywords: ["credential"],
  },
  {
    href: "/student/orders",
    label: "Orders",
    icon: Receipt,
    keywords: ["invoice", "payment"],
  },
  {
    href: "/student/support",
    label: "Technical Support",
    icon: HeadphonesIcon,
    keywords: ["ticket", "help"],
  },
  {
    href: "/student/notifications",
    label: "Notifications",
    icon: Bell,
    keywords: ["alerts"],
  },
  {
    href: "/student/profile",
    label: "Profile",
    icon: UserRound,
    keywords: ["account", "settings"],
  },
];

export const STUDENT_SIDEBAR_SECTIONS: {
  title: string;
  items: StudentNavItem[];
}[] = [
  {
    title: "Overview",
    items: [
      STUDENT_COMMAND_PAGES.find((i) => i.href === "/student/dashboard")!,
    ],
  },
  {
    title: "Learning",
    items: [
      STUDENT_COMMAND_PAGES.find((i) => i.href === "/student/courses")!,
      STUDENT_COMMAND_PAGES.find((i) => i.href === "/student/feedback")!,
      STUDENT_COMMAND_PAGES.find((i) => i.href === "/student/resources")!,
      STUDENT_COMMAND_PAGES.find((i) => i.href === "/student/certificates")!,
    ],
  },
  {
    title: "Activity",
    items: [
      STUDENT_COMMAND_PAGES.find((i) => i.href === "/student/orders")!,
      STUDENT_COMMAND_PAGES.find((i) => i.href === "/student/support")!,
      STUDENT_COMMAND_PAGES.find((i) => i.href === "/student/notifications")!,
      STUDENT_COMMAND_PAGES.find((i) => i.href === "/student/profile")!,
    ],
  },
];

/** @deprecated Prefer STUDENT_SIDEBAR_SECTIONS */
export const STUDENT_SIDEBAR_NAV = STUDENT_SIDEBAR_SECTIONS.flatMap(
  (section) => section.items,
);


