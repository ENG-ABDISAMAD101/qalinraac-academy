"use client";

import Link from "next/link";
import { ClipboardList, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StepProps } from "../types";

/** Quizzes & assignments are managed on their dedicated instructor pages. */
export function AssessmentStep(_props: StepProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card-soft space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-primary dark:text-foreground">
            Assessment
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quizzes and assignments are managed outside the course builder.
            Create and grade them from the Quizzes and Assignments pages.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border px-4 py-5">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">Quizzes</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Build quizzes, review attempts, and allow retakes.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4">
              <Link href="/instructor/quizzes">Open Quizzes</Link>
            </Button>
          </div>
          <div className="rounded-2xl border border-border px-4 py-5">
            <ClipboardList className="h-5 w-5 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              Assignments
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create assignments and grade student submissions.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4">
              <Link href="/instructor/assignments">Open Assignments</Link>
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          This step is optional. Continue to Pricing when you are ready.
        </p>
      </div>
    </div>
  );
}
