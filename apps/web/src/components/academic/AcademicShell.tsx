"use client";

import type { ReactNode } from "react";
import { useRequireAuth } from "@/lib/auth-context";
import { PortalChrome } from "@/components/portal/PortalChrome";
import { AcademicNotificationsMenu } from "@/components/academic/AcademicNotificationsMenu";
import { AcademicProfileMenu } from "@/components/academic/AcademicProfileMenu";
import {
  ACADEMIC_COMMAND_PAGES,
  ACADEMIC_SIDEBAR_SECTIONS,
} from "@/components/academic/academic-nav";
import { PageLoader } from "@/components/ui/spinner";

export function AcademicShell({ children }: { children: ReactNode }) {
  const { user, ready, logout, usingDemo } = useRequireAuth([
    "Academic",
    "Super Admin",
    "SuperAdmin",
  ]);

  if (!ready || !user) {
    return <PageLoader label="Loading academic portal" />;
  }

  return (
    <PortalChrome
      sections={ACADEMIC_SIDEBAR_SECTIONS}
      commandPages={ACADEMIC_COMMAND_PAGES}
      portalLabel="Academic portal"
      roleLabel="Academic"
      dashboardHref="/academic/dashboard"
      profileHref="/academic/profile"
      collapseStorageKey="qa_academic_sidebar_collapsed"
      searchPlaceholder="Search pages…"
      notifications={<AcademicNotificationsMenu />}
      profileMenu={<AcademicProfileMenu />}
      user={user}
      usingDemo={usingDemo}
      logout={logout}
      demoNote="Demo mode — academic portal."
    >
      {children}
    </PortalChrome>
  );
}

export function academicStatusTone(status: string) {
  switch (status) {
    case "Published":
    case "Approved":
    case "Active":
    case "Ready":
    case "Completed":
      return "bg-primary-soft text-primary";
    case "Pending Review":
    case "Pending":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "Rejected":
    case "Inactive":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    case "Draft":
    case "Archived":
    default:
      return "bg-muted text-muted-foreground";
  }
}
