"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/lib/auth-context";
import { PortalChrome } from "@/components/portal/PortalChrome";
import { InstructorNotificationsMenu } from "@/components/instructor/InstructorNotificationsMenu";
import { InstructorOnboarding } from "@/components/instructor/InstructorOnboarding";
import { InstructorProfileMenu } from "@/components/instructor/InstructorProfileMenu";
import {
  INSTRUCTOR_COMMAND_PAGES,
  INSTRUCTOR_SIDEBAR_SECTIONS,
} from "@/components/instructor/instructor-nav";
import { PageLoader } from "@/components/ui/spinner";

export function InstructorShell({ children }: { children: ReactNode }) {
  const { user, ready, logout, usingDemo, onboardingCompleted } =
    useRequireAuth("Instructor");

  if (!ready || !user) {
    return <PageLoader label="Loading" />;
  }

  return (
    <PortalChrome
      beforeHeader={<InstructorOnboarding />}
      sections={INSTRUCTOR_SIDEBAR_SECTIONS}
      commandPages={INSTRUCTOR_COMMAND_PAGES}
      portalLabel="Instructor portal"
      roleLabel="Instructor"
      dashboardHref="/instructor/dashboard"
      profileHref="/instructor/profile"
      collapseStorageKey="qa_instructor_sidebar_collapsed"
      searchPlaceholder="Search pages…"
      notifications={<InstructorNotificationsMenu />}
      profileMenu={<InstructorProfileMenu />}
      user={user}
      usingDemo={usingDemo}
      logout={logout}
      demoNote="Demo mode — instructor portal."
      contentClassName={cn(
        !onboardingCompleted && "pointer-events-none select-none blur-[2px]",
      )}
    >
      {children}
    </PortalChrome>
  );
}

export function statusTone(status: string) {
  switch (status) {
    case "Published":
    case "Passed":
    case "Completed":
    case "Paid":
      return "bg-primary-soft text-primary";
    case "In Progress":
    case "Pending Review":
    case "Pending Changes":
    case "Pending":
    case "Submitted":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "Rejected":
    case "Failed":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    case "Draft":
    case "Archived":
    default:
      return "bg-muted text-muted-foreground";
  }
}
