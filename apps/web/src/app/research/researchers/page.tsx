"use client";

import {
  ResearchShell,
  researchStatusTone,
} from "@/components/research/ResearchShell";
import {
  ScrollTable,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { demoResearchers } from "@/lib/research-demo-data";
import { cn } from "@/lib/utils";

export default function ResearchersPage() {
  return (
    <ResearchShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Researchers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Authorized research staff — access limited to assigned data
          </p>
        </div>
        <ScrollTable minWidthClassName="min-w-[52rem]">
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Research Area</th>
              <th className="px-5 py-3 font-medium">Active Projects</th>
              <th className="px-5 py-3 font-medium">Papers</th>
              <th className="px-5 py-3 font-medium">Publications</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoResearchers.map((r) => (
              <tr key={r.id} className="border-b border-border/70">
                <td className="px-5 py-4 font-semibold">{r.name}</td>
                <td className="px-5 py-4">{r.email}</td>
                <td className="px-5 py-4">{r.area}</td>
                <td className="px-5 py-4">{r.activeProjects}</td>
                <td className="px-5 py-4">{r.papers}</td>
                <td className="px-5 py-4">{r.publications}</td>
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
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </ResearchShell>
  );
}
