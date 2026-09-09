"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AdminShell,
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
  demoAdminStudents,
  type AdminStudentStatus,
} from "@/lib/admin-demo-data";
import { cn } from "@/lib/utils";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState(demoAdminStudents);
  const [filter, setFilter] = useState<"All" | AdminStudentStatus>("All");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return students.filter((s) => {
      if (filter !== "All" && s.status !== filter) return false;
      const hay = `${s.name} ${s.email} ${s.phone}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [students, filter, q]);

  function setStatus(id: string, status: AdminStudentStatus) {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s)),
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Students
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enable or disable accounts — Admin cannot delete students
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone…"
            className="h-10 min-w-[14rem] flex-1 rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-brand-navy"
          />
          {(["All", "Active", "Disabled"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold",
                filter === f
                  ? "bg-brand-navy text-white dark:bg-brand-lime dark:text-brand-navy"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <ScrollTable
          minWidthClassName="min-w-[52rem]"
          maxHeightClassName="max-h-[32rem]"
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Registration Date</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {rows.map((s) => (
              <tr
                key={s.id}
                className="border-b border-border/70 hover:bg-accent/40"
              >
                <td className="px-5 py-4 font-semibold">{s.name}</td>
                <td className="px-5 py-4">{s.email}</td>
                <td className="px-5 py-4 text-muted-foreground">{s.phone}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      adminStatusTone(s.status),
                    )}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {s.registeredAt}
                </td>
                <StickyActionCell>
                  <div className="flex flex-wrap gap-1.5">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/students/${s.id}`}>View</Link>
                    </Button>
                    {s.status === "Active" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setStatus(s.id, "Disabled")}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-brand-lime text-brand-navy hover:bg-brand-lime/90"
                        onClick={() => setStatus(s.id, "Active")}
                      >
                        Enable
                      </Button>
                    )}
                  </div>
                </StickyActionCell>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </AdminShell>
  );
}
