"use client";

import Link from "next/link";
import {
  ResearchShell,
  researchStatusTone,
} from "@/components/research/ResearchShell";
import { Button } from "@/components/ui/button";
import {
  ScrollTable,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import {
  demoResearchProjects,
  demoResearchStats,
  demoReviews,
  demoSubmissions,
} from "@/lib/research-demo-data";
import { cn } from "@/lib/utils";

export default function ResearchDashboardPage() {
  const stats = [
    { label: "Total Researchers", value: demoResearchStats.totalResearchers },
    {
      label: "Active Research Projects",
      value: demoResearchStats.activeProjects,
    },
    { label: "Draft Papers", value: demoResearchStats.draftPapers },
    { label: "Submitted Papers", value: demoResearchStats.submittedPapers },
    { label: "Papers Under Review", value: demoResearchStats.underReview },
    { label: "Approved Papers", value: demoResearchStats.approvedPapers },
    { label: "Published Papers", value: demoResearchStats.publishedPapers },
  ];

  const activeProjects = demoResearchProjects.filter(
    (p) => p.status === "Active" || p.status === "Under Review",
  );
  const pendingReviews = demoReviews.filter(
    (r) => r.status === "Under Review" || r.status === "Submitted",
  );

  return (
    <ResearchShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Research Work Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Projects, submissions, and reviews — independent of academic &
            finance
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card-soft px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-3 text-base font-bold">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/research/reviews">Pending Reviews</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/research/projects">Projects</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/research/submissions">Submissions</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/research/papers">Papers</Link>
            </Button>
          </div>
        </section>

        <ScrollTable
          minWidthClassName="min-w-[52rem]"
          maxHeightClassName="max-h-[18rem]"
          toolbar={
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Pending Reviews</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/research/reviews">View all</Link>
              </Button>
            </div>
          }
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Paper Title</th>
              <th className="px-5 py-3 font-medium">Researcher</th>
              <th className="px-5 py-3 font-medium">Submitted</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {pendingReviews.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border/70 hover:bg-accent/40"
              >
                <td className="px-5 py-4 font-semibold">{r.paper}</td>
                <td className="px-5 py-4">{r.researcher}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {r.submittedDate}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      researchStatusTone(r.status),
                    )}
                  >
                    {r.status}
                  </span>
                </td>
                <StickyActionCell>
                  <Button asChild size="sm">
                    <Link href={`/research/reviews/${r.id}`}>Review</Link>
                  </Button>
                </StickyActionCell>
              </tr>
            ))}
          </tbody>
        </ScrollTable>

        <ScrollTable
          minWidthClassName="min-w-[48rem]"
          maxHeightClassName="max-h-[18rem]"
          toolbar={<p className="text-sm font-semibold">Active Research Projects</p>}
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Project</th>
              <th className="px-5 py-3 font-medium">Researchers</th>
              <th className="px-5 py-3 font-medium">Progress</th>
              <th className="px-5 py-3 font-medium">Start Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {activeProjects.map((p) => (
              <tr key={p.id} className="border-b border-border/70">
                <td className="px-5 py-4 font-semibold">{p.title}</td>
                <td className="px-5 py-4 text-sm">{p.researchers.join(", ")}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold">{p.progress}%</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{p.startDate}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      researchStatusTone(p.status),
                    )}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>

        <ScrollTable
          minWidthClassName="min-w-[44rem]"
          maxHeightClassName="max-h-[16rem]"
          toolbar={<p className="text-sm font-semibold">Recent Submissions</p>}
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Paper</th>
              <th className="px-5 py-3 font-medium">Researcher</th>
              <th className="px-5 py-3 font-medium">Submission Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoSubmissions.slice(0, 4).map((s) => (
              <tr key={s.id} className="border-b border-border/70">
                <td className="px-5 py-4 font-semibold">{s.paper}</td>
                <td className="px-5 py-4">{s.researcher}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {s.submittedDate}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      researchStatusTone(s.status),
                    )}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </ResearchShell>
  );
}
