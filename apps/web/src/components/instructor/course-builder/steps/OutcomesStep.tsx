"use client";

import { CheckListEditor } from "../CheckListEditor";
import type { StepProps } from "../types";

export function OutcomesStep({ draft, setDraft, readOnly }: StepProps) {
  return (
    <div className="mx-auto max-w-3xl">
      <CheckListEditor
        id="learning-outcome"
        title="What You'll Learn"
        hint="Add clear, outcome-focused bullets. Students see these with checkmarks."
        addLabel="Add Learning Outcome"
        placeholder="e.g. Build cross-platform apps"
        items={draft.learningOutcomes}
        readOnly={readOnly}
        onChange={(learningOutcomes) => setDraft({ learningOutcomes })}
      />
    </div>
  );
}
