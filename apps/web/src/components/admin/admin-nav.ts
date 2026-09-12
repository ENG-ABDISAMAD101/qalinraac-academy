import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  GraduationCap,
  Home,
  LayoutDashboard,
  LifeBuoy,
  UserRound,
  Users,
} from "lucide-react";
import type {
  PortalNavItem,
  PortalNavSection,
} from "@/components/portal/portal-types";

export const ADMIN_COMMAND_PAGES: PortalNavItem[] = [
  { href: "/", label: "Home", icon: Home, keywords: ["site", "landing"] },
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    keywords: ["overview"],
  },
  {
    href: "/admin/students",
    label: "Students",
    icon: Users,
    keywords: ["learners"],
  },
  {
    href: "/admin/instructors",
    label: "Instructors",
    icon: GraduationCap,
    keywords: ["teachers"],
  },
  {
    href: "/admin/courses",
    label: "Courses",
    icon: BookOpen,
    keywords: ["catalog"],
  },
  {
    href: "/admin/certificates",
    label: "Certificates",
    icon: Award,
    keywords: ["credential"],
  },
  {
    href: "/admin/support",
    label: "Support Tickets",
    icon: LifeBuoy,
    keywords: ["help", "tickets"],
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: BarChart3,
    keywords: ["analytics"],
  },
  {
    href: "/admin/notifications",
    label: "Notifications",
    icon: Bell,
    keywords: ["alerts"],
  },
  {
    href: "/admin/profile",
    label: "Profile",
    icon: UserRound,
    keywords: ["account", "settings"],
  },
];

const p = (href: string) => ADMIN_COMMAND_PAGES.find((i) => i.href === href)!;

export const ADMIN_SIDEBAR_SECTIONS: PortalNavSection[] = [
  {
    title: "Overview",
    items: [p("/admin/dashboard")],
  },
  {
    title: "Operations",
    items: [
      p("/admin/students"),
      p("/admin/instructors"),
      p("/admin/courses"),
      p("/admin/certificates"),
      p("/admin/support"),
    ],
  },
  {
    title: "Account",
    items: [
      p("/admin/reports"),
      p("/admin/notifications"),
      p("/admin/profile"),
    ],
  },
];
