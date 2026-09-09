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
import { demoSubmissions } from "@/lib/research-demo-data";
import { cn } from "@/lib/utils";

export default function ResearchSubmissionsPage() {
  return (
    <ResearchShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Submissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Version history · Reviewer → Revision → Resubmit → Review again
          </p>
        </div>
        <ScrollTable minWidthClassName="min-w-[60rem]">
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Paper</th>
              <th className="px-5 py-3 font-medium">Researcher</th>
              <th className="px-5 py-3 font-medium">Version</th>
              <th className="px-5 py-3 font-medium">Submitted</th>
              <th className="px-5 py-3 font-medium">Reviewer</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Feedback</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoSubmissions.map((s) => (
              <tr key={s.id} className="border-b border-border/70">
                <td className="max-w-[14rem] px-5 py-4 font-semibold">
                  {s.paper}
                </td>
                <td className="px-5 py-4">{s.researcher}</td>
                <td className="px-5 py-4">{s.version}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {s.submittedDate}
                </td>
                <td className="px-5 py-4">{s.reviewer}</td>
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
                <td className="max-w-[12rem] truncate px-5 py-4 text-sm text-muted-foreground">
                  {s.feedback}
                </td>
                <StickyActionCell>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/research/papers/${s.paperId}`}>Open</Link>
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
