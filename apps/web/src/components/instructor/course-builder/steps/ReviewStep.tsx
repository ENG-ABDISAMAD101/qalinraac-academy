"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  courseCategoryLabel,
  formatMoney,
  getApiErrorMessage,
  instructorCourseChecklistRequest,
  mediaPublicUrl,
  type InstructorCourseChecklist,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ACCESS_DURATIONS,
  LANGUAGES,
  MISSING_LABELS,
  MISSING_STEP,
  levelLabel,
  type BuilderStepNumber,
  type StepProps,
} from "../types";

type ReviewStepProps = StepProps & {
  status: string;
  onGoToStep: (step: BuilderStepNumber) => void;
};

const CHECK_ROWS: {
  key: keyof InstructorCourseChecklist["checklist"];
  label: string;
  step: BuilderStepNumber;
}[] = [
  { key: "basicInfo", label: "Basic Information", step: 1 },
  { key: "description", label: "Description", step: 2 },
  { key: "learningOutcomes", label: "Learning Outcomes", step: 3 },
  { key: "requirements", label: "Requirements", step: 4 },
  { key: "curriculum", label: "Curriculum", step: 5 },
  { key: "lessons", label: "Lessons", step: 6 },
  { key: "assessment", label: "Assessment", step: 7 },
  { key: "pricing", label: "Pricing", step: 8 },
];

function languageDisplay(value?: string) {
  if (!value) return "—";
  return LANGUAGES.find((l) => l.value === value)?.label ?? value;
}

function accessDurationDisplay(value?: string) {
  if (!value) return "—";
  return ACCESS_DURATIONS.find((d) => d.value === value)?.label ?? value;
}

export function ReviewStep({
  courseId,
  draft,
  status,
  readOnly,
  onGoToStep,
}: ReviewStepProps) {
  const [data, setData] = useState<InstructorCourseChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await instructorCourseChecklistRequest(courseId));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load the review checklist."));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const thumb = mediaPublicUrl(draft.thumbnailUrl || undefined);
  const missing = data?.missing ?? [];
  const completeness = Math.min(100, Math.max(0, data?.completeness ?? 0));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="space-y-5">
        <div className="card-soft p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-brand-navy dark:text-foreground">
                Course Preview
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirm everything looks ready before submitting for Academic
                review.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={() => void load()}
            >
              <RefreshCw className="h-4 w-4" />
              Re-check
            </Button>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="flex min-h-[10rem] items-center justify-center">
              <Spinner label="Checking course" />
            </div>
          ) : data ? (
            <>
              <ul className="mt-5 space-y-2">
                {CHECK_ROWS.map((row) => {
                  const done = data.checklist[row.key];
                  return (
                    <li
                      key={row.key}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-4 py-3",
                        done
                          ? "border-border/70"
                          : "border-destructive/40 bg-destructive/5",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                          done
                            ? "bg-brand-lime text-brand-navy"
                            : "bg-destructive/15 text-destructive",
                        )}
                      >
                        {done ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
                        {row.label}
                      </span>
                      {!done ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onGoToStep(row.step)}
                        >
                          Fix
                        </Button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
                <p className="text-sm font-bold text-brand-navy dark:text-foreground">
                  Course completeness: {completeness}%
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-lime transition-all"
                    style={{
                      width: `${completeness}%`,
                    }}
                  />
                </div>
              </div>

              {missing.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm font-bold text-destructive">
                    {missing.length}{" "}
                    {missing.length === 1 ? "item" : "items"} must be completed
                    before submitting
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {missing.map((key) => (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => onGoToStep(MISSING_STEP[key] ?? 1)}
                          className="rounded-full border border-destructive/40 px-3 py-1 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
                        >
                          {MISSING_LABELS[key] ?? key}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : status !== "pending_review" ? (
                <div className="mt-5 rounded-2xl bg-brand-lime-soft p-4">
                  <p className="text-sm font-bold text-brand-navy">
                    This course is ready to mark as complete.
                  </p>
                  <p className="mt-1 text-sm text-brand-navy/80">
                    {status === "published"
                      ? "Use Mark Course as Complete in the header to send updates back for Academic review."
                      : "Use Mark Course as Complete in the header or footer when you are happy with the content. Editing locks while review is in progress."}
                  </p>
                </div>
              ) : null}

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Sections", value: data.counts.modules },
                  { label: "Lessons", value: data.counts.lessons },
                  { label: "Quizzes", value: data.counts.quizzes },
                  { label: "Assignments", value: data.counts.assignments },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border/70 px-4 py-3"
                  >
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="mt-0.5 text-xl font-bold text-brand-navy dark:text-foreground">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {!readOnly && data.canSubmit && status !== "pending_review" ? (
                <p className="mt-5 text-sm text-muted-foreground">
                  When ready, click{" "}
                  <span className="font-semibold text-foreground">
                    Mark Course as Complete
                  </span>{" "}
                  above.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <aside className="card-soft h-fit space-y-4 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Course summary
        </p>
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
          {thumb ? (
            <Image
              src={thumb}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
              No thumbnail uploaded
            </div>
          )}
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-brand-navy dark:text-foreground">
            {draft.title || "Untitled Course"}
          </h3>
        </div>
        <dl className="space-y-2 border-t border-border pt-4 text-sm">
          {[
            {
              label: "Category",
              value: courseCategoryLabel(draft.category) || "—",
            },
            { label: "Level", value: levelLabel(draft.level) || "—" },
            { label: "Language", value: languageDisplay(draft.language) },
            {
              label: "Price",
              value: draft.isFree
                ? "Free"
                : formatMoney(draft.priceCents, draft.currency),
            },
            {
              label: "Access",
              value: accessDurationDisplay(draft.accessDuration),
            },
          ].map((row) => (
            <div key={row.label} className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="text-right font-medium capitalize text-foreground">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  );
}
