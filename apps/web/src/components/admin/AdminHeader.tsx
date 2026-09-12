"use client";

import { useState } from "react";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { AdminNotificationsMenu } from "@/components/admin/AdminNotificationsMenu";
import { AdminProfileMenu } from "@/components/admin/AdminProfileMenu";

/** Prefer AdminShell (owns header + command menu). Kept for isolated use. */
export function AdminHeader() {
  const [commandOpen, setCommandOpen] = useState(false);
  return (
    <PortalHeader
      dashboardHref="/admin/dashboard"
      commandOpen={commandOpen}
      onCommandOpenChange={setCommandOpen}
      searchPlaceholder="Search pages…"
      notifications={<AdminNotificationsMenu />}
      profile={<AdminProfileMenu />}
    />
  );
}
