"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AdminShell,
  adminPriorityTone,
  adminStatusTone,
} from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  ScrollTable,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import {
  demoAdminTickets,
  type AdminTicketStatus,
} from "@/lib/admin-demo-data";
import { cn } from "@/lib/utils";

export default function AdminSupportPage() {
  const [statusFilter, setStatusFilter] = useState<"All" | AdminTicketStatus>(
    "All",
  );
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return demoAdminTickets.filter((t) => {
      if (statusFilter !== "All" && t.status !== statusFilter) return false;
      const hay = `${t.id} ${t.user} ${t.subject}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [statusFilter, q]);

  return (
    <AdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Support Tickets
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View, reply, close, and reopen — core Admin responsibility
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ticket #, user, subject…"
            className="h-10 min-w-[14rem] flex-1 rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-brand-navy"
          />
          {(
            [
              "All",
              "Open",
              "In Progress",
              "Waiting for User",
              "Resolved",
              "Closed",
            ] as const
          ).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={cn(
                "rounded-full px-3 py-2 text-xs font-semibold",
                statusFilter === f
                  ? "bg-brand-navy text-white dark:bg-brand-lime dark:text-brand-navy"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <ScrollTable
          minWidthClassName="min-w-[60rem]"
          maxHeightClassName="max-h-[32rem]"
        >
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
            {rows.map((t) => (
              <tr
                key={t.id}
                className="border-b border-border/70 hover:bg-accent/40"
              >
                <td className="whitespace-nowrap px-5 py-4 font-mono text-xs font-semibold">
                  {t.id}
                </td>
                <td className="px-5 py-4 font-semibold">{t.user}</td>
                <td className="px-5 py-4">{t.userRole}</td>
                <td className="max-w-[16rem] truncate px-5 py-4">{t.subject}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      adminPriorityTone(t.priority),
                    )}
                  >
                    {t.priority}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      adminStatusTone(t.status),
                    )}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {t.createdAt}
                </td>
                <StickyActionCell>
                  <Button asChild size="sm">
                    <Link href={`/admin/support/${t.id}`}>View</Link>
                  </Button>
                </StickyActionCell>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </AdminShell>
  );
}
