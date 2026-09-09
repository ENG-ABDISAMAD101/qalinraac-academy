"use client";

import { SuperAdminShell, money } from "@/components/super-admin/SuperAdminShell";
import { Button } from "@/components/ui/button";
import { demoSaReports } from "@/lib/super-admin-demo-data";

export default function SuperAdminReportsPage() {
  const r = demoSaReports;

  return (
    <SuperAdminShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Global Reports
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cross-module analytics with filter, date range, and export hooks
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              className="h-10 rounded-2xl border border-border bg-background px-3 text-sm"
              defaultValue="2026-08-01"
            />
            <input
              type="date"
              className="h-10 rounded-2xl border border-border bg-background px-3 text-sm"
              defaultValue="2026-09-08"
            />
            <Button type="button" variant="outline">
              Export CSV
            </Button>
          </div>
        </div>

        {(
          [
            ["Students", Object.entries(r.students)],
            ["Instructors", Object.entries(r.instructors)],
            ["Courses", Object.entries(r.courses)],
            ["Academic Operations", Object.entries(r.academic)],
            ["Finance", Object.entries(r.finance)],
            ["Research", Object.entries(r.research)],
            ["Support", Object.entries(r.support)],
          ] as const
        ).map(([title, entries]) => (
          <section key={title}>
            <h2 className="mb-3 text-lg font-bold">{title}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {entries.map(([label, value]) => (
                <div key={label} className="card-soft px-5 py-4">
                  <p className="text-xs capitalize text-muted-foreground">
                    {label.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {title === "Finance" ? money(Number(value)) : value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </SuperAdminShell>
  );
}
