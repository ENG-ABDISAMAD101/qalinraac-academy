"use client";

import type { ReactNode } from "react";
import { useRequireAuth } from "@/lib/auth-context";
import { PortalChrome } from "@/components/portal/PortalChrome";
import { ResearchNotificationsMenu } from "@/components/research/ResearchNotificationsMenu";
import { ResearchProfileMenu } from "@/components/research/ResearchProfileMenu";
import {
  RESEARCH_COMMAND_PAGES,
  RESEARCH_SIDEBAR_SECTIONS,
} from "@/components/research/research-nav";
import { PageLoader } from "@/components/ui/spinner";

export function ResearchShell({ children }: { children: ReactNode }) {
  const { user, ready, logout, usingDemo } = useRequireAuth([
    "Research",
    "Researcher",
  ]);

  if (!ready || !user) {
    return <PageLoader label="Loading research portal" />;
  }

  return (
    <PortalChrome
      sections={RESEARCH_SIDEBAR_SECTIONS}
      commandPages={RESEARCH_COMMAND_PAGES}
      portalLabel="Research portal"
      roleLabel="Research"
      dashboardHref="/research/dashboard"
      profileHref="/research/profile"
      collapseStorageKey="qa_research_sidebar_collapsed"
      searchPlaceholder="Search pages…"
      notifications={<ResearchNotificationsMenu />}
      profileMenu={<ResearchProfileMenu />}
      user={user}
      usingDemo={usingDemo}
      logout={logout}
      demoNote="Demo mode — research operations only."
    >
      {children}
    </PortalChrome>
  );
}

export function researchStatusTone(status: string) {
  switch (status) {
    case "Active":
    case "Approved":
    case "Published":
    case "Completed":
    case "Ready for Publication":
      return "bg-primary-soft text-primary";
    case "Submitted":
    case "Under Review":
    case "Resubmitted":
    case "Final Submission":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "Revision Requested":
    case "Draft":
      return "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200";
    case "Rejected":
    case "Inactive":
    case "Archived":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}
