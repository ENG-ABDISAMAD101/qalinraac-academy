import {
  Banknote,
  BarChart3,
  Bell,
  HandCoins,
  Home,
  LayoutDashboard,
  Receipt,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import type {
  PortalNavItem,
  PortalNavSection,
} from "@/components/portal/portal-types";

export const FINANCE_COMMAND_PAGES: PortalNavItem[] = [
  { href: "/", label: "Home", icon: Home, keywords: ["site", "landing"] },
  {
    href: "/finance/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    keywords: ["overview"],
  },
  {
    href: "/finance/revenue",
    label: "Revenue",
    icon: Wallet,
    keywords: ["income", "sales"],
  },
  {
    href: "/finance/expenses",
    label: "Expenses",
    icon: Receipt,
    keywords: ["costs"],
  },
  {
    href: "/finance/instructor-payments",
    label: "Instructor Payments",
    icon: HandCoins,
    keywords: ["payout", "earnings"],
  },
  {
    href: "/finance/withdrawals",
    label: "Withdrawals",
    icon: Banknote,
    keywords: ["cashout"],
  },
  {
    href: "/finance/shareholders",
    label: "Shareholders",
    icon: Users,
    keywords: ["distribution"],
  },
  {
    href: "/finance/reports",
    label: "Reports",
    icon: BarChart3,
    keywords: ["analytics"],
  },
  {
    href: "/finance/notifications",
    label: "Notifications",
    icon: Bell,
    keywords: ["alerts"],
  },
  {
    href: "/finance/profile",
    label: "Profile",
    icon: UserRound,
    keywords: ["account", "settings"],
  },
];

const p = (href: string) =>
  FINANCE_COMMAND_PAGES.find((i) => i.href === href)!;

export const FINANCE_SIDEBAR_SECTIONS: PortalNavSection[] = [
  {
    title: "Overview",
    items: [p("/finance/dashboard")],
  },
  {
    title: "Money",
    items: [
      p("/finance/revenue"),
      p("/finance/expenses"),
      p("/finance/instructor-payments"),
      p("/finance/withdrawals"),
      p("/finance/shareholders"),
    ],
  },
  {
    title: "Account",
    items: [
      p("/finance/reports"),
      p("/finance/notifications"),
      p("/finance/profile"),
    ],
  },
];
