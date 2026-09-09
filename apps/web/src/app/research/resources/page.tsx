"use client";

import { useMemo, useState } from "react";
import { ResearchShell } from "@/components/research/ResearchShell";
import { Button } from "@/components/ui/button";
import {
  ScrollTable,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import { demoResearchResources } from "@/lib/research-demo-data";

export default function ResearchResourcesPage() {
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return demoResearchResources;
    return demoResearchResources.filter((r) =>
      `${r.title} ${r.type} ${r.format}`.toLowerCase().includes(needle),
    );
  }, [q]);

  return (
    <ResearchShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Research Resources
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Guidelines, templates, methodology, journals, policies — PDF, DOCX,
            PPTX, XLSX, ZIP, images
          </p>
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search resources…"
          className="h-10 w-full max-w-md rounded-2xl border border-border bg-background px-4 text-sm"
        />
        {flash ? (
          <p className="text-sm text-primary">{flash}</p>
        ) : null}
        <ScrollTable minWidthClassName="min-w-[40rem]">
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Format</th>
              <th className="px-5 py-3 font-medium">Updated</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/70">
                <td className="px-5 py-4 font-semibold">{r.title}</td>
                <td className="px-5 py-4">{r.type}</td>
                <td className="px-5 py-4">{r.format}</td>
                <td className="px-5 py-4 text-muted-foreground">{r.updatedAt}</td>
                <StickyActionCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFlash(`Download queued · ${r.title}`)}
                  >
                    Download
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
