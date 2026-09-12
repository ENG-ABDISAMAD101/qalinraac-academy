import {
  Award,
  Banknote,
  Bell,
  BookOpen,
  ClipboardList,
  FileText,
  FolderOpen,
  HeadphonesIcon,
  Home,
  Inbox,
  LayoutDashboard,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import type {
  PortalNavItem,
  PortalNavSection,
} from "@/components/portal/portal-types";

export const INSTRUCTOR_COMMAND_PAGES: PortalNavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    keywords: ["site", "landing"],
  },
  {
    href: "/instructor/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    keywords: ["overview"],
  },
  {
    href: "/instructor/courses",
    label: "My Courses",
    icon: BookOpen,
    keywords: ["teach", "content"],
  },
  {
    href: "/instructor/students",
    label: "Students",
    icon: Users,
    keywords: ["learners"],
  },
  {
    href: "/instructor/submissions",
    label: "Submissions",
    icon: Inbox,
    keywords: ["grade", "review"],
  },
  {
    href: "/instructor/assignments",
    label: "Assignments",
    icon: ClipboardList,
    keywords: ["homework"],
  },
  {
    href: "/instructor/quizzes",
    label: "Quizzes",
    icon: Award,
    keywords: ["exam", "test"],
  },
  {
    href: "/instructor/resources",
    label: "Resources",
    icon: FolderOpen,
    keywords: ["files"],
  },
  {
    href: "/instructor/earnings",
    label: "Earnings",
    icon: Wallet,
    keywords: ["income", "payout"],
  },
  {
    href: "/instructor/withdrawals",
    label: "Withdrawals",
    icon: Banknote,
    keywords: ["cashout"],
  },
  {
    href: "/instructor/agreement",
    label: "Agreement",
    icon: FileText,
    keywords: ["contract"],
  },
  {
    href: "/instructor/support",
    label: "Technical Support",
    icon: HeadphonesIcon,
    keywords: ["ticket", "help"],
  },
  {
    href: "/instructor/notifications",
    label: "Notifications",
    icon: Bell,
    keywords: ["alerts"],
  },
  {
    href: "/instructor/profile",
    label: "Profile",
    icon: UserRound,
    keywords: ["account", "settings"],
  },
];

const p = (href: string) =>
  INSTRUCTOR_COMMAND_PAGES.find((i) => i.href === href)!;

export const INSTRUCTOR_SIDEBAR_SECTIONS: PortalNavSection[] = [
  {
    title: "Overview",
    items: [p("/instructor/dashboard")],
  },
  {
    title: "Teaching",
    items: [
      p("/instructor/courses"),
      p("/instructor/students"),
      p("/instructor/submissions"),
      p("/instructor/assignments"),
      p("/instructor/quizzes"),
      p("/instructor/resources"),
    ],
  },
  {
    title: "Finance",
    items: [
      p("/instructor/earnings"),
      p("/instructor/withdrawals"),
      p("/instructor/agreement"),
    ],
  },
  {
    title: "Account",
    items: [
      p("/instructor/support"),
      p("/instructor/notifications"),
      p("/instructor/profile"),
    ],
  },
];
