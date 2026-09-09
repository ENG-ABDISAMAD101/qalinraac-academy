"use client";

import { useState } from "react";
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
  demoPublications,
  type PublicationStatus,
} from "@/lib/research-demo-data";
import { cn } from "@/lib/utils";

export default function ResearchPublicationsPage() {
  const [items, setItems] = useState(demoPublications);
  const [flash, setFlash] = useState<string | null>(null);

  function markPublished(id: string) {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: "Published" as PublicationStatus,
              publicationDate: "08 Sep 2026",
              doi: p.doi === "pending" ? `10.qalinraac/edu.${id}` : p.doi,
            }
          : p,
      ),
    );
    setFlash("Marked published (demo).");
  }

  return (
    <ResearchShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Publications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approved → Ready for Publication → Published
          </p>
        </div>
        {flash ? (
          <p className="text-sm text-brand-navy dark:text-brand-lime">{flash}</p>
        ) : null}
        <ScrollTable minWidthClassName="min-w-[56rem]">
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Paper Title</th>
              <th className="px-5 py-3 font-medium">Authors</th>
              <th className="px-5 py-3 font-medium">Area</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">DOI</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-border/70">
                <td className="px-5 py-4 font-semibold">{p.title}</td>
                <td className="px-5 py-4 text-sm">{p.authors.join(", ")}</td>
                <td className="px-5 py-4">{p.area}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {p.publicationDate}
                </td>
                <td className="px-5 py-4 font-mono text-xs">{p.doi}</td>
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
                  {p.status !== "Published" ? (
                    <Button size="sm" onClick={() => markPublished(p.id)}>
                      Publish
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {p.document}
                    </span>
                  )}
                </StickyActionCell>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </ResearchShell>
  );
}
