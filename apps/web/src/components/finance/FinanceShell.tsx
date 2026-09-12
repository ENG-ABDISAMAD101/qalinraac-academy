"use client";

import type { ReactNode } from "react";
import { useRequireAuth } from "@/lib/auth-context";
import { PortalChrome } from "@/components/portal/PortalChrome";
import { FinanceNotificationsMenu } from "@/components/finance/FinanceNotificationsMenu";
import { FinanceProfileMenu } from "@/components/finance/FinanceProfileMenu";
import {
  FINANCE_COMMAND_PAGES,
  FINANCE_SIDEBAR_SECTIONS,
} from "@/components/finance/finance-nav";
import { PageLoader } from "@/components/ui/spinner";

export function FinanceShell({ children }: { children: ReactNode }) {
  const { user, ready, logout, usingDemo } = useRequireAuth([
    "Finance",
    "Super Admin",
    "SuperAdmin",
  ]);

  if (!ready || !user) {
    return <PageLoader label="Loading finance portal" />;
  }

  return (
    <PortalChrome
      sections={FINANCE_SIDEBAR_SECTIONS}
      commandPages={FINANCE_COMMAND_PAGES}
      portalLabel="Finance portal"
      roleLabel="Finance"
      dashboardHref="/finance/dashboard"
      profileHref="/finance/profile"
      collapseStorageKey="qa_finance_sidebar_collapsed"
      searchPlaceholder="Search pages…"
      notifications={<FinanceNotificationsMenu />}
      profileMenu={<FinanceProfileMenu />}
      user={user}
      usingDemo={usingDemo}
      logout={logout}
      demoNote="Demo mode — finance portal."
    >
      {children}
    </PortalChrome>
  );
}

export function financeStatusTone(status: string) {
  switch (status) {
    case "Completed":
    case "Approved":
    case "Distributed":
    case "Paid":
      return "bg-primary-soft text-primary";
    case "Pending":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "Rejected":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function money(n: number) {
  return `$${n.toLocaleString()}`;
}
