"use client";

import {
  SuperAdminShell,
  saStatusTone,
} from "@/components/super-admin/SuperAdminShell";
import { demoSaResearch } from "@/lib/super-admin-demo-data";
import { cn } from "@/lib/utils";

export default function SuperAdminResearchPage() {
  const r = demoSaResearch;

  return (
    <SuperAdminShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Research Control
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Projects, papers, and submissions — {r.users} research users
          </p>
        </div>

        <section className="card-soft overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold">Projects</h2>
          </div>
          <ul className="divide-y divide-border/70">
            {r.projects.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.lead} · {p.papers} papers
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold",
                    saStatusTone(p.status),
                  )}
                >
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-soft overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold">Submissions</h2>
          </div>
          <ul className="divide-y divide-border/70">
            {r.submissions.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.author} · {s.date}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold",
                    saStatusTone(s.status),
                  )}
                >
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SuperAdminShell>
  );
}
