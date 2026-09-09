"use client";

import { CheckListEditor } from "../CheckListEditor";
import type { StepProps } from "../types";

export function RequirementsStep({ draft, setDraft, readOnly }: StepProps) {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
      <CheckListEditor
        id="requirement"
        title="Requirements"
        hint="What students should know before starting."
        addLabel="Add Requirement"
        placeholder="e.g. Basic JavaScript"
        items={draft.requirements}
        readOnly={readOnly}
        optional
        onChange={(requirements) => setDraft({ requirements })}
      />
      <CheckListEditor
        id="audience"
        title="Who Is This Course For?"
        hint="Target learners for this course."
        addLabel="Add Target Audience"
        placeholder="e.g. Beginner developers"
        items={draft.targetAudience}
        readOnly={readOnly}
        optional
        onChange={(targetAudience) => setDraft({ targetAudience })}
      />
    </div>
  );
}
