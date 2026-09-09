"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ResearchShell,
  researchStatusTone,
} from "@/components/research/ResearchShell";
import { Button } from "@/components/ui/button";
import { demoResearchProjects } from "@/lib/research-demo-data";
import { cn } from "@/lib/utils";

export default function ResearchProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const p =
    demoResearchProjects.find((x) => x.id === params.id) ??
    demoResearchProjects[0];

  return (
    <ResearchShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/research/projects">← Projects</Link>
        </Button>
        <div className="card-soft space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-brand-navy dark:text-foreground">
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
          <p className="text-sm text-muted-foreground">{p.description}</p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Research area</dt>
              <dd className="font-semibold">{p.area}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Documents</dt>
              <dd className="font-semibold">{p.documents}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Objectives</dt>
              <dd className="font-semibold">{p.objectives}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Methodology</dt>
              <dd className="font-semibold">{p.methodology}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Researchers</dt>
              <dd className="font-semibold">{p.researchers.join(", ")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Timeline</dt>
              <dd className="font-semibold">
                {p.startDate} → {p.endDate}
              </dd>
            </div>
          </dl>
          <div>
            <p className="mb-2 text-sm font-medium">Progress · {p.progress}%</p>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-lime"
                style={{ width: `${p.progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </ResearchShell>
  );
}
