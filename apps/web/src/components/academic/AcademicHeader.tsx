"use client";

import { useState } from "react";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { AcademicNotificationsMenu } from "@/components/academic/AcademicNotificationsMenu";
import { AcademicProfileMenu } from "@/components/academic/AcademicProfileMenu";

/** Prefer AcademicShell (owns header + command menu). Kept for isolated use. */
export function AcademicHeader() {
  const [commandOpen, setCommandOpen] = useState(false);
  return (
    <PortalHeader
      dashboardHref="/academic/dashboard"
      commandOpen={commandOpen}
      onCommandOpenChange={setCommandOpen}
      searchPlaceholder="Search pages…"
      notifications={<AcademicNotificationsMenu />}
      profile={<AcademicProfileMenu />}
    />
  );
}
