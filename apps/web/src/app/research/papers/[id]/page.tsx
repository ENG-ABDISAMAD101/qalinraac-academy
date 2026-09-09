"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ResearchShell,
  researchStatusTone,
} from "@/components/research/ResearchShell";
import { Button } from "@/components/ui/button";
import { demoResearchPapers } from "@/lib/research-demo-data";
import { cn } from "@/lib/utils";

export default function ResearchPaperDetailPage() {
  const params = useParams<{ id: string }>();
  const p =
    demoResearchPapers.find((x) => x.id === params.id) ?? demoResearchPapers[0];
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <ResearchShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/research/papers">← Papers</Link>
        </Button>
        <div className="card-soft space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-primary dark:text-foreground">
              {p.title}
            </h1>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                researchStatusTone(p.status),
              )}
            >
              {p.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{p.abstract}</p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Keywords</dt>
              <dd className="font-semibold">{p.keywords}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Area</dt>
              <dd className="font-semibold">{p.area}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Authors</dt>
              <dd className="font-semibold">{p.authors.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Project</dt>
              <dd className="font-semibold">{p.project}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Document</dt>
              <dd className="font-semibold">{p.document}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">References</dt>
              <dd className="font-semibold">{p.references}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Version</dt>
              <dd className="font-semibold">{p.version}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="font-semibold">{p.submissionDate}</dd>
            </div>
          </dl>
          {p.status === "Draft" ? (
            <Button
              type="button"
              onClick={() => setFlash("Paper submitted for review (demo).")}
            >
              Submit paper
            </Button>
          ) : null}
          {p.status === "Revision Requested" ? (
            <Button
              type="button"
              onClick={() => setFlash("Revision resubmitted (demo).")}
            >
              Resubmit revision
            </Button>
          ) : null}
          {flash ? (
            <p className="text-sm text-primary">{flash}</p>
          ) : null}
        </div>
      </div>
    </ResearchShell>
  );
}
