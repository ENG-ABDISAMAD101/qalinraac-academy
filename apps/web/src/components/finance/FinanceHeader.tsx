"use client";

import { useState } from "react";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { FinanceNotificationsMenu } from "@/components/finance/FinanceNotificationsMenu";
import { FinanceProfileMenu } from "@/components/finance/FinanceProfileMenu";

/** Prefer FinanceShell (owns header + command menu). Kept for isolated use. */
export function FinanceHeader() {
  const [commandOpen, setCommandOpen] = useState(false);
  return (
    <PortalHeader
      dashboardHref="/finance/dashboard"
      commandOpen={commandOpen}
      onCommandOpenChange={setCommandOpen}
      searchPlaceholder="Search pages…"
      notifications={<FinanceNotificationsMenu />}
      profile={<FinanceProfileMenu />}
    />
  );
}
