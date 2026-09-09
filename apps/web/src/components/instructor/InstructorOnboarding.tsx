"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const STEPS = [
  {
    title: "Welcome",
    body: "You're joining Qalinraac Academy as an Instructor. Manage your courses, support students, and track earnings from one place.",
  },
  {
    title: "Course Management",
    body: "Build courses with sections and lessons, add quizzes and assignments, then submit for Academic Review. Published courses need an update request for further edits.",
  },
  {
    title: "Instructor Agreement",
    body: "Please read the Instructor Agreement carefully. You can download a copy for your records. Editing the agreement is not allowed.",
  },
  {
    title: "You're ready",
    body: "Finish onboarding to open your instructor dashboard. Super Admin can reset this flow if needed.",
  },
] as const;

export function InstructorOnboarding() {
  const { user, onboardingCompleted, completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const open = Boolean(user?.role === "Instructor" && !onboardingCompleted);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open]);

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isAgreement = step === 2;

  async function onFinish() {
    setFinishing(true);
    try {
      await completeOnboarding();
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructor-onboarding-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2
          id="instructor-onboarding-title"
          className="mt-2 font-display text-2xl font-bold text-primary"
        >
          {current.title}
          {step === 0 ? `, ${user?.fullName?.split(" ")[0] ?? "Instructor"}` : ""}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {current.body}
        </p>

        {step === 0 ? (
          <div className="mt-5 aspect-video overflow-hidden rounded-xl bg-muted">
            <iframe
              title="Instructor welcome video"
              className="h-full w-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null}

        {isAgreement ? (
          <div className="mt-5 rounded-xl border border-border bg-muted/50 p-4 text-sm">
            <p className="font-semibold text-foreground">
              Instructor Agreement (view only)
            </p>
            <p className="mt-2 text-muted-foreground">
              By continuing you confirm you have read the institutional Instructor
              Agreement covering content ownership, revenue share, and conduct.
            </p>
            <Button type="button" variant="outline" className="mt-4" asChild>
              <Link href="/instructor/agreement">View agreements</Link>
            </Button>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0 || finishing}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          {isLast ? (
            <Button
              type="button"
              disabled={finishing}
              onClick={() => void onFinish()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {finishing ? (
                <Spinner className="sm on-primary" label="Finishing" />
              ) : null}
              Finish
            </Button>
          ) : (
            <Button type="button" onClick={() => setStep((s) => s + 1)}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
