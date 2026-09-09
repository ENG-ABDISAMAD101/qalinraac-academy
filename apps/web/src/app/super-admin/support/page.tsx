"use client";

import { useState } from "react";
import {
  SuperAdminShell,
  saStatusTone,
} from "@/components/super-admin/SuperAdminShell";
import { Button } from "@/components/ui/button";
import {
  ScrollTable,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import { demoSaTickets } from "@/lib/super-admin-demo-data";
import { cn } from "@/lib/utils";

export default function SuperAdminSupportPage() {
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <SuperAdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Support
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All platform tickets — replies, attachments, priority, and status
          </p>
        </div>
        {flash ? (
          <p className="text-sm text-brand-navy dark:text-brand-lime">{flash}</p>
        ) : null}
        <ScrollTable minWidthClassName="min-w-[56rem]">
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Ticket #</th>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Subject</th>
              <th className="px-5 py-3 font-medium">Priority</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoSaTickets.map((t) => (
              <tr key={t.id} className="border-b border-border/70">
                <td className="px-5 py-4 font-mono text-xs font-semibold">
                  {t.id}
                </td>
                <td className="px-5 py-4 font-semibold">{t.user}</td>
                <td className="px-5 py-4">{t.role}</td>
                <td className="max-w-[14rem] truncate px-5 py-4">{t.subject}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      saStatusTone(t.priority),
                    )}
                  >
                    {t.priority}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      saStatusTone(t.status),
                    )}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{t.createdAt}</td>
                <StickyActionCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setFlash(`Opened thread for ${t.id} (demo).`)
                    }
                  >
                    Manage
                  </Button>
                </StickyActionCell>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </SuperAdminShell>
  );
}
