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
import { demoReviews } from "@/lib/research-demo-data";
import { cn } from "@/lib/utils";

export default function ResearchReviewsPage() {
  return (
    <ResearchShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Reviews
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve, reject, or request revision — authors cannot self-approve
          </p>
        </div>
        <ScrollTable minWidthClassName="min-w-[52rem]">
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Paper</th>
              <th className="px-5 py-3 font-medium">Researcher</th>
              <th className="px-5 py-3 font-medium">Submitted</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoReviews.map((r) => (
              <tr key={r.id} className="border-b border-border/70">
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
      </div>
    </ResearchShell>
  );
}
