import {
  BarChart3,
  Bell,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Home,
  LayoutDashboard,
  Library,
  Newspaper,
  Send,
  UserRound,
  Users,
} from "lucide-react";
import type {
  PortalNavItem,
  PortalNavSection,
} from "@/components/portal/portal-types";

export const RESEARCH_COMMAND_PAGES: PortalNavItem[] = [
  { href: "/", label: "Home", icon: Home, keywords: ["site", "landing"] },
  {
    href: "/research/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    keywords: ["overview", "work center"],
  },
  {
    href: "/research/projects",
    label: "Research Projects",
    icon: FolderKanban,
    keywords: ["project"],
  },
  {
    href: "/research/papers",
    label: "Research Papers",
    icon: FileText,
    keywords: ["paper", "manuscript"],
  },
  {
    href: "/research/researchers",
    label: "Researchers",
    icon: Users,
    keywords: ["authors"],
  },
  {
    href: "/research/submissions",
    label: "Submissions",
    icon: Send,
    keywords: ["submit"],
  },
  {
    href: "/research/reviews",
    label: "Reviews",
    icon: ClipboardCheck,
    keywords: ["peer review"],
  },
  {
    href: "/research/publications",
    label: "Publications",
    icon: Newspaper,
    keywords: ["publish"],
  },
  {
    href: "/research/resources",
    label: "Research Resources",
    icon: Library,
    keywords: ["files", "library"],
  },
  {
    href: "/research/reports",
    label: "Reports",
    icon: BarChart3,
    keywords: ["analytics"],
  },
  {
    href: "/research/notifications",
    label: "Notifications",
    icon: Bell,
    keywords: ["alerts"],
  },
  {
    href: "/research/profile",
    label: "Profile",
    icon: UserRound,
    keywords: ["account", "settings"],
  },
];

const p = (href: string) =>
  RESEARCH_COMMAND_PAGES.find((i) => i.href === href)!;

export const RESEARCH_SIDEBAR_SECTIONS: PortalNavSection[] = [
  {
    title: "Overview",
    items: [p("/research/dashboard")],
  },
  {
    title: "Research",
    items: [
      p("/research/projects"),
      p("/research/papers"),
      p("/research/researchers"),
      p("/research/submissions"),
      p("/research/reviews"),
      p("/research/publications"),
      p("/research/resources"),
    ],
  },
  {
    title: "Account",
    items: [
      p("/research/reports"),
      p("/research/notifications"),
      p("/research/profile"),
    ],
  },
];
