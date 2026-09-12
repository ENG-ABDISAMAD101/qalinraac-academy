"use client";

import { useState } from "react";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { ResearchNotificationsMenu } from "@/components/research/ResearchNotificationsMenu";
import { ResearchProfileMenu } from "@/components/research/ResearchProfileMenu";

/** Prefer ResearchShell (owns header + command menu). Kept for isolated use. */
export function ResearchHeader() {
  const [commandOpen, setCommandOpen] = useState(false);
  return (
    <PortalHeader
      dashboardHref="/research/dashboard"
      commandOpen={commandOpen}
      onCommandOpenChange={setCommandOpen}
      searchPlaceholder="Search pages…"
      notifications={<ResearchNotificationsMenu />}
      profile={<ResearchProfileMenu />}
    />
  );
}
