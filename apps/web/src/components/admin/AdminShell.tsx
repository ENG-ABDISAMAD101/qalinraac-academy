"use client";

import type { ReactNode } from "react";
import { useRequireAuth } from "@/lib/auth-context";
import { PortalChrome } from "@/components/portal/PortalChrome";
import { AdminNotificationsMenu } from "@/components/admin/AdminNotificationsMenu";
import { AdminProfileMenu } from "@/components/admin/AdminProfileMenu";
import {
  ADMIN_COMMAND_PAGES,
  ADMIN_SIDEBAR_SECTIONS,
} from "@/components/admin/admin-nav";
import { PageLoader } from "@/components/ui/spinner";

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, ready, logout, usingDemo } = useRequireAuth("Admin");

  if (!ready || !user) {
    return <PageLoader label="Loading admin portal" />;
  }

  return (
    <PortalChrome
      sections={ADMIN_SIDEBAR_SECTIONS}
      commandPages={ADMIN_COMMAND_PAGES}
      portalLabel="Admin portal"
      roleLabel="Admin"
      dashboardHref="/admin/dashboard"
      profileHref="/admin/profile"
      collapseStorageKey="qa_admin_sidebar_collapsed"
      searchPlaceholder="Search pages…"
      notifications={<AdminNotificationsMenu />}
      profileMenu={<AdminProfileMenu />}
      user={user}
      usingDemo={usingDemo}
      logout={logout}
      demoNote="Demo mode — admin operations portal."
    >
      {children}
    </PortalChrome>
  );
}

function normalizeToneKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function adminStatusTone(status: string) {
  switch (normalizeToneKey(status)) {
    case "active":
    case "published":
    case "resolved":
    case "issued":
    case "ready":
    case "approved":
      return "bg-primary/10 text-primary";
    case "open":
    case "pending":
    case "pending_review":
      return "bg-muted text-muted-foreground";
    case "disabled":
    case "rejected":
    case "urgent":
    case "high":
      return "bg-destructive/10 text-destructive";
    case "medium":
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function adminPriorityTone(priority: string) {
  switch (normalizeToneKey(priority)) {
    case "urgent":
    case "high":
      return "bg-destructive/10 text-destructive";
    case "medium":
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function formatAdminStatusLabel(status: string) {
  const key = normalizeToneKey(status);
  const labels: Record<string, string> = {
    active: "Active",
    disabled: "Disabled",
    published: "Published",
    pending: "Pending",
    pending_review: "Pending",
    open: "Open",
    resolved: "Resolved",
    high: "High",
    medium: "Medium",
    urgent: "Urgent",
    issued: "Issued",
    approved: "Approved",
    ready: "Ready",
    rejected: "Rejected",
  };
  return labels[key] ?? status;
}

export function formatAdminDate(value?: string | Date | null) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
