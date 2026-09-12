import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  FileText,
  GraduationCap,
  Home,
  KeyRound,
  LayoutDashboard,
  UserRound,
  Users,
} from "lucide-react";
import type {
  PortalNavItem,
  PortalNavSection,
} from "@/components/portal/portal-types";

export const ACADEMIC_COMMAND_PAGES: PortalNavItem[] = [
  { href: "/", label: "Home", icon: Home, keywords: ["site", "landing"] },
  {
    href: "/academic/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    keywords: ["overview", "queue"],
  },
  {
    href: "/academic/students",
    label: "Students",
    icon: Users,
    keywords: ["learners"],
  },
  {
    href: "/academic/instructors",
    label: "Instructors",
    icon: GraduationCap,
    keywords: ["teachers"],
  },
  {
    href: "/academic/courses",
    label: "Courses",
    icon: BookOpen,
    keywords: ["review", "publish"],
  },
  {
    href: "/academic/activations",
    label: "Student Activations",
    icon: KeyRound,
    keywords: ["access", "enroll"],
  },
  {
    href: "/academic/certificates",
    label: "Certificates",
    icon: Award,
    keywords: ["credential"],
  },
  {
    href: "/academic/agreements",
    label: "Instructor Agreements",
    icon: FileText,
    keywords: ["contract"],
  },
  {
    href: "/academic/reports",
    label: "Reports",
    icon: BarChart3,
    keywords: ["analytics"],
  },
  {
    href: "/academic/notifications",
    label: "Notifications",
    icon: Bell,
    keywords: ["alerts"],
  },
  {
    href: "/academic/profile",
    label: "Profile",
    icon: UserRound,
    keywords: ["account", "settings"],
  },
];

const p = (href: string) =>
  ACADEMIC_COMMAND_PAGES.find((i) => i.href === href)!;

export const ACADEMIC_SIDEBAR_SECTIONS: PortalNavSection[] = [
  {
    title: "Overview",
    items: [p("/academic/dashboard")],
  },
  {
    title: "People",
    items: [p("/academic/students"), p("/academic/instructors")],
  },
  {
    title: "Academic",
    items: [
      p("/academic/courses"),
      p("/academic/activations"),
      p("/academic/certificates"),
      p("/academic/agreements"),
    ],
  },
  {
    title: "Account",
    items: [
      p("/academic/reports"),
      p("/academic/notifications"),
      p("/academic/profile"),
    ],
  },
];
