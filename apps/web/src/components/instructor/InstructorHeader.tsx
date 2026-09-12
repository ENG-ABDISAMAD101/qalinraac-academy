"use client";

import { useState } from "react";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { InstructorNotificationsMenu } from "@/components/instructor/InstructorNotificationsMenu";
import { InstructorProfileMenu } from "@/components/instructor/InstructorProfileMenu";

/** Prefer InstructorShell (owns header + command menu). Kept for isolated use. */
export function InstructorHeader() {
  const [commandOpen, setCommandOpen] = useState(false);
  return (
    <PortalHeader
      dashboardHref="/instructor/dashboard"
      commandOpen={commandOpen}
      onCommandOpenChange={setCommandOpen}
      searchPlaceholder="Search pages…"
      notifications={<InstructorNotificationsMenu />}
      profile={<InstructorProfileMenu />}
    />
  );
}
