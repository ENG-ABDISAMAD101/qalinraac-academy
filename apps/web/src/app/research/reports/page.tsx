"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ResearchShell } from "@/components/research/ResearchShell";
import { Button } from "@/components/ui/button";
import { demoResearchReports } from "@/lib/research-demo-data";

const chartData = [
  { label: "Draft", value: demoResearchReports.papers.draft },
  { label: "Review", value: demoResearchReports.papers.underReview },
  { label: "Approved", value: demoResearchReports.papers.approved },
  { label: "Rejected", value: demoResearchReports.papers.rejected },
  { label: "Published", value: demoResearchReports.papers.published },
];

export default function ResearchReportsPage() {
  const r = demoResearchReports;

  return (
    <ResearchShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Research Reports
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Analytics for researchers, projects, and papers
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              defaultValue="2026-01-01"
              className="h-10 rounded-2xl border border-border bg-background px-3 text-sm"
            />
            <input
              type="date"
              defaultValue="2026-09-08"
              className="h-10 rounded-2xl border border-border bg-background px-3 text-sm"
            />
            <Button type="button" variant="outline">
              Export CSV
            </Button>
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-bold">Researchers</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Total Researchers", r.researchers.total],
              ["Active Researchers", r.researchers.active],
            ].map(([label, value]) => (
              <div key={String(label)} className="card-soft px-5 py-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Projects</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Total Projects", r.projects.total],
              ["Active Projects", r.projects.active],
              ["Completed Projects", r.projects.completed],
            ].map(([label, value]) => (
              <div key={String(label)} className="card-soft px-5 py-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Papers</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Total Papers", r.papers.total],
              ["Draft Papers", r.papers.draft],
              ["Under Review", r.papers.underReview],
              ["Approved", r.papers.approved],
              ["Rejected", r.papers.rejected],
              ["Published", r.papers.published],
            ].map(([label, value]) => (
              <div key={String(label)} className="card-soft px-5 py-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card-soft p-5">
          <h2 className="mb-4 text-base font-bold">Paper pipeline</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#111827" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </ResearchShell>
  );
}
