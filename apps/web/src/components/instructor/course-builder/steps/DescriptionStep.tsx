"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StepProps } from "../types";

export function DescriptionStep({ draft, setDraft, readOnly }: StepProps) {
  return (
    <div className="card-soft mx-auto max-w-3xl space-y-5 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-brand-navy dark:text-foreground">
          Description
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell students what this course is about.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="about-course">About This Course</Label>
        <Textarea
          id="about-course"
          rows={12}
          disabled={readOnly}
          value={draft.description}
          placeholder="Describe the course goals, topics covered, and what makes it valuable…"
          onChange={(e) => setDraft({ description: e.target.value })}
          className="min-h-[220px]"
        />
      </div>
    </div>
  );
}
