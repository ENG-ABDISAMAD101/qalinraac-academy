"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  demoResearchPapers,
  type ResearchPaperStatus,
} from "@/lib/research-demo-data";
import { cn } from "@/lib/utils";

const FILTERS: Array<"All" | ResearchPaperStatus> = [
  "All",
  "Draft",
  "Submitted",
  "Under Review",
  "Revision Requested",
  "Approved",
  "Published",
];

export default function ResearchPapersPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    return demoResearchPapers.filter((p) => {
      if (filter !== "All" && p.status !== filter) return false;
      const hay = `${p.title} ${p.authors.join(" ")} ${p.area}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [filter, q]);

  return (
    <ResearchShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Research Papers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft → Submit → Review → Approve / Revise → Publish
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search papers…"
            className="h-10 min-w-[14rem] flex-1 rounded-2xl border border-border bg-background px-4 text-sm"
          />
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-2 text-xs font-semibold",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <ScrollTable minWidthClassName="min-w-[60rem]" maxHeightClassName="max-h-[34rem]">
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Authors</th>
              <th className="px-5 py-3 font-medium">Project</th>
              <th className="px-5 py-3 font-medium">Version</th>
              <th className="px-5 py-3 font-medium">Submitted</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-border/70 hover:bg-accent/40">
                <td className="max-w-[16rem] px-5 py-4 font-semibold">{p.title}</td>
                <td className="px-5 py-4 text-sm">{p.authors.join(", ")}</td>
                <td className="px-5 py-4 text-sm">{p.project}</td>
                <td className="px-5 py-4">{p.version}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {p.submissionDate}
                </td>
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
                <StickyActionCell>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/research/papers/${p.id}`}>View</Link>
                  </Button>
                </StickyActionCell>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </ResearchShell>
  );
}
