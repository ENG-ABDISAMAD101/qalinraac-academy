"use client";

import { useMemo, useState } from "react";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import {
  ScrollTable,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { demoAuditLogs } from "@/lib/super-admin-demo-data";

export default function SuperAdminAuditLogsPage() {
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return demoAuditLogs;
    return demoAuditLogs.filter((l) =>
      `${l.who} ${l.action} ${l.target} ${l.oldValue} ${l.newValue}`
        .toLowerCase()
        .includes(needle),
    );
  }, [q]);

  return (
    <SuperAdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Who · Action · Target · Old → New · IP · Timestamp
          </p>
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search actor, action, target…"
          className="h-10 w-full max-w-md rounded-2xl border border-border bg-background px-4 text-sm"
        />
        <ScrollTable
          minWidthClassName="min-w-[64rem]"
          maxHeightClassName="max-h-[36rem]"
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Who</th>
              <th className="px-5 py-3 font-medium">Action</th>
              <th className="px-5 py-3 font-medium">Target</th>
              <th className="px-5 py-3 font-medium">Old value</th>
              <th className="px-5 py-3 font-medium">New value</th>
              <th className="px-5 py-3 font-medium">IP</th>
              <th className="px-5 py-3 font-medium">Timestamp</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="border-b border-border/70">
                <td className="whitespace-nowrap px-5 py-4 font-semibold">
                  {l.who}
                </td>
                <td className="px-5 py-4">{l.action}</td>
                <td className="px-5 py-4">{l.target}</td>
                <td className="px-5 py-4 text-muted-foreground">{l.oldValue}</td>
                <td className="px-5 py-4 font-medium">{l.newValue}</td>
                <td className="px-5 py-4 font-mono text-xs">{l.ip}</td>
                <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                  {l.at}
                </td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </SuperAdminShell>
  );
}
