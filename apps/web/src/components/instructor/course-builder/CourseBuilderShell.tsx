"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CloudOff,
  Info,
} from "lucide-react";
import { statusTone } from "@/components/instructor/InstructorShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  BUILDER_STEPS,
  TOTAL_STEPS,
  courseStatusLabel,
  type BuilderStepNumber,
  type SaveStatus,
} from "./types";

const COMPLETE_DURATION_MS = 60_000;

function HeaderStatusText({
  status,
  displayStatus,
  isRevisionDraft,
  saveStatus,
  lastSavedAt,
  readyToPublish,
  readOnly,
}: {
  status: string;
  displayStatus?: string;
  isRevisionDraft?: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  readyToPublish: boolean;
  readOnly: boolean;
}) {
  if (status === "in_progress" || status === "pending_review") {
    return (
      <span className="text-xs font-medium text-muted-foreground">
        In Progress · pending Academic review (view only)
      </span>
    );
  }
  if (isRevisionDraft) {
    return (
      <span className="text-xs font-medium text-primary">
        Published · editing changes (not live yet)
      </span>
    );
  }
  if (status === "published" && !readOnly) {
    return (
      <span className="text-xs font-medium text-primary">
        Published · use Edit to create a draft revision
      </span>
    );
  }
  if (saveStatus === "saving") {
    return (
      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Spinner className="sm" label="Saving" />
        Saving…
      </span>
    );
  }
  if (saveStatus === "error") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
        <CloudOff className="h-3.5 w-3.5" />
        Changes not saved
      </span>
    );
  }
  if (readyToPublish && !readOnly) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Ready to mark complete
      </span>
    );
  }
  if (saveStatus === "saved" || lastSavedAt) {
    return (
      <span className="text-xs text-muted-foreground">
        Last saved{" "}
        {(lastSavedAt ?? new Date()).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">
      {displayStatus === "In Progress" ? "In Progress" : "Draft in progress"}
    </span>
  );
}

export type CourseBuilderShellProps = {
  courseId: string;
  courseTitle: string;
  status: string;
  displayStatus?: string;
  reviewStatus?: string;
  isRevisionDraft?: boolean;
  readOnly: boolean;
  step: BuilderStepNumber;
  onStepChange: (step: BuilderStepNumber) => void;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
  saveError?: string;
  completedSteps?: Set<number>;
  readyToPublish?: boolean;
  onSaveDraft: () => void;
  onMarkComplete: () => Promise<void>;
  actionBusy?: boolean;
  actionMessage?: string;
  actionError?: string;
  children: ReactNode;
};

export function CourseBuilderShell({
  courseId,
  courseTitle,
  status,
  displayStatus,
  reviewStatus,
  isRevisionDraft = false,
  readOnly,
  step,
  onStepChange,
  saveStatus,
  lastSavedAt,
  saveError,
  completedSteps,
  readyToPublish = false,
  onSaveDraft,
  onMarkComplete,
  actionBusy = false,
  actionMessage,
  actionError,
  children,
}: CourseBuilderShellProps) {
  const label = courseStatusLabel(status, displayStatus);
  const percent = Math.round((step / TOTAL_STEPS) * 100);
  const current = BUILDER_STEPS[step - 1];

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressError, setProgressError] = useState("");
  const [progressDone, setProgressDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const submitStartedRef = useRef(false);
  /** Lock only while the API submit is in flight (not during the wait bar). */
  const progressLocked = progressOpen && submitting && !progressDone && !progressError;

  const underReview =
    status === "in_progress" ||
    reviewStatus === "pending_review" ||
    status === "pending_review";

  const canMarkComplete =
    !readOnly &&
    (status === "draft" ||
      status === "rejected" ||
      reviewStatus === "changes_requested" ||
      isRevisionDraft);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function resetProgressState() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startedAtRef.current = null;
    submitStartedRef.current = false;
    setProgress(0);
    setProgressError("");
    setProgressDone(false);
    setSubmitting(false);
  }

  function openConfirm() {
    cancelledRef.current = false;
    resetProgressState();
    setConfirmOpen(true);
  }

  function cancelProgressFlow() {
    if (progressLocked) return;
    cancelledRef.current = true;
    resetProgressState();
    setProgressOpen(false);
  }

  function startProgressFlow() {
    cancelledRef.current = false;
    submitStartedRef.current = false;
    setConfirmOpen(false);
    setProgressOpen(true);
    setProgress(0);
    setProgressError("");
    setProgressDone(false);
    setSubmitting(false);
    startedAtRef.current = performance.now();

    const finishAndSubmit = async () => {
      if (cancelledRef.current || submitStartedRef.current) return;
      submitStartedRef.current = true;
      setProgress(100);
      setSubmitting(true);
      try {
        await onMarkComplete();
        if (cancelledRef.current) {
          // Rare race: withdraw if submit landed after cancel.
          await onSaveDraft();
          resetProgressState();
          setProgressOpen(false);
          return;
        }
        setProgressDone(true);
      } catch (err) {
        if (cancelledRef.current) {
          resetProgressState();
          setProgressOpen(false);
          return;
        }
        setProgressError(
          err instanceof Error
            ? err.message
            : "Could not submit the course for review.",
        );
      } finally {
        setSubmitting(false);
      }
    };

    const tick = (now: number) => {
      if (cancelledRef.current) return;
      const started = startedAtRef.current ?? now;
      const elapsed = now - started;
      const next = Math.min(100, (elapsed / COMPLETE_DURATION_MS) * 100);
      setProgress(next);

      if (elapsed >= COMPLETE_DURATION_MS) {
        void finishAndSubmit();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col">
      <div className="sticky top-16 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="space-y-3 px-4 pb-3 pt-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="-ml-2 h-7 px-2 text-xs"
              >
                <Link href={`/instructor/courses/${courseId}`}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to course
                </Link>
              </Button>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-xl font-bold text-primary dark:text-foreground sm:text-2xl">
                  {courseTitle || "Untitled Course"}
                </h1>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-bold",
                    statusTone(label),
                  )}
                >
                  {label}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <HeaderStatusText
                status={status}
                displayStatus={displayStatus}
                isRevisionDraft={isRevisionDraft}
                saveStatus={saveStatus}
                lastSavedAt={lastSavedAt}
                readyToPublish={readyToPublish}
                readOnly={readOnly}
              />
            </div>
          </div>

          <Progress value={percent} className="h-1.5" />

          <nav
            aria-label="Course builder steps"
            className="scrollbar-thin -mx-1 flex gap-1 overflow-x-auto pb-1"
          >
            {BUILDER_STEPS.map((s) => {
              const active = s.step === step;
              const done = completedSteps?.has(s.step) ?? false;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => onStepChange(s.step as BuilderStepNumber)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                      active
                        ? "bg-primary-foreground/20 text-primary-foreground dark:bg-primary/15 dark:text-primary"
                        : done
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done && !active ? <Check className="h-3 w-3" /> : s.step}
                  </span>
                  {s.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {underReview ? (
          <p className="mb-5 flex items-start gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              <strong className="font-semibold">Pending Academic Review.</strong>{" "}
              Your course has been submitted for review. You can no longer modify
              the submitted version until it is returned.
            </span>
          </p>
        ) : null}

        {isRevisionDraft && !underReview ? (
          <p className="mb-5 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
            <strong className="font-semibold">Editing Changes.</strong> Your
            changes are not live yet. They will be reviewed before being
            published.
          </p>
        ) : null}

        {readOnly && status === "archived" ? (
          <p className="mb-5 flex items-start gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            Archived courses are read-only.
          </p>
        ) : null}

        {saveError ? (
          <p className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {saveError}
          </p>
        ) : null}
        {actionError ? (
          <p className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}
        {actionMessage ? (
          <p className="mb-5 rounded-2xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
            {actionMessage}
          </p>
        ) : null}

        {children}
      </div>

      <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={step === 1}
            onClick={() => onStepChange((step - 1) as BuilderStepNumber)}
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="order-last flex w-full flex-col items-center gap-0.5 text-center sm:order-none sm:w-auto">
            <p className="text-xs text-muted-foreground">
              {lastSavedAt
                ? `Last saved ${lastSavedAt.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : saveStatus === "saved"
                  ? "Saved"
                  : "Not saved yet"}
            </p>
            <p className="text-xs font-semibold text-foreground">
              Step {step} of {TOTAL_STEPS} · {current.label}
            </p>
          </div>

          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              onClick={() => onStepChange((step + 1) as BuilderStepNumber)}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : canMarkComplete ? (
            <Button
              type="button"
              disabled={actionBusy || progressOpen}
              onClick={openConfirm}
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark as Completed
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled>
              {underReview ? "In review" : "Done"}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isRevisionDraft
                ? "Submit your changes for review?"
                : "Mark this course as completed?"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Confirm submitting this course for Academic review.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-foreground dark:border-primary/20 dark:bg-primary/10">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              {isRevisionDraft
                ? "The published course stays live for students. Your changes move to In Progress and wait for Academic review."
                : "Status becomes In Progress and the course is sent for Academic review. Students cannot see it until it is published."}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={startProgressFlow}>
              Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={progressOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelProgressFlow();
            return;
          }
          setProgressOpen(open);
        }}
      >
        <DialogContent
          className="max-w-md"
          hideClose={progressLocked}
          onPointerDownOutside={(e) => {
            if (progressLocked) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (progressLocked) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (progressLocked) e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {progressDone
                ? "Course submitted for Academic review."
                : progressError
                  ? "Submission failed"
                  : submitting
                    ? "Submitting your course"
                    : "Preparing your course"}
            </DialogTitle>
            <DialogDescription>
              {progressDone
                ? "The builder is now locked until Academic responds."
                : progressError
                  ? progressError
                  : submitting
                    ? "Please wait while we submit your course…"
                    : "Preparing your course for Academic review…"}
            </DialogDescription>
          </DialogHeader>

          {!progressDone && !progressError ? (
            <div className="space-y-3 py-2">
              <Progress value={progress} className="h-2.5" />
              <p className="text-center text-sm font-semibold tabular-nums text-primary">
                {Math.round(progress)}%
              </p>
              {!submitting ? (
                <p className="text-center text-xs text-muted-foreground">
                  You can cancel to keep this course as a draft.
                </p>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Submitting now — please wait a moment.
                </p>
              )}
            </div>
          ) : null}

          {progressDone || progressError ? (
            <DialogFooter className="gap-2">
              {progressDone ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    void (async () => {
                      try {
                        await onSaveDraft();
                      } finally {
                        resetProgressState();
                        setProgressOpen(false);
                      }
                    })();
                  }}
                >
                  Return to draft
                </Button>
              ) : null}
              <Button type="button" onClick={() => setProgressOpen(false)}>
                {progressDone ? "Done" : "Close"}
              </Button>
            </DialogFooter>
          ) : !submitting ? (
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={cancelProgressFlow}>
                Cancel — keep as draft
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
