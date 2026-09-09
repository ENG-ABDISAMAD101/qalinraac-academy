"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage, studentFeedbackQuizRequest } from "@/lib/api";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(...values: unknown[]) {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

function pickNumber(...values: unknown[]) {
  for (const v of values) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return null;
}

export default function FeedbackQuizPage() {
  const params = useParams<{ id: string }>();
  const quizId = params.id;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!quizId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await studentFeedbackQuizRequest(quizId);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load quiz details."));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  const quiz = asRecord(data?.quiz) ?? data;
  const title = pickString(quiz?.title, "Quiz");
  const description = pickString(quiz?.description, "No description provided.");
  const courseTitle = pickString(
    data?.courseTitle,
    asRecord(data?.course)?.title,
    typeof data?.course === "string" ? data.course : "",
    "Course",
  );
  const questionCount =
    pickNumber(quiz?.questionCount, quiz?.totalQuestions) ?? 0;
  const passingScore = pickNumber(quiz?.passingScore) ?? 70;

  return (
    <StudentShell>
      <div className="space-y-6 px-6 py-6 lg:px-8">
        <Button asChild variant="ghost" className="-ml-2 w-fit">
          <Link href="/student/feedback">
            <ArrowLeft className="h-4 w-4" />
            Back to feedback
          </Link>
        </Button>

        {loading ? (
          <div className="flex min-h-[14rem] items-center justify-center">
            <Spinner label="Loading quiz" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <article className="card-soft mx-auto max-w-2xl space-y-5 p-6 sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-brand-lime">
                Quiz
              </p>
              <h1 className="mt-2 font-display text-2xl font-bold text-brand-navy dark:text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>

            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-canvas px-4 py-3 dark:bg-muted/40">
                <dt className="text-xs text-muted-foreground">Course</dt>
                <dd className="mt-1 text-sm font-semibold text-ink dark:text-foreground">
                  {courseTitle}
                </dd>
              </div>
              <div className="rounded-2xl bg-canvas px-4 py-3 dark:bg-muted/40">
                <dt className="text-xs text-muted-foreground">Total Questions</dt>
                <dd className="mt-1 text-sm font-semibold text-ink dark:text-foreground">
                  {questionCount}
                </dd>
              </div>
              <div className="rounded-2xl bg-canvas px-4 py-3 dark:bg-muted/40">
                <dt className="text-xs text-muted-foreground">Passing Score</dt>
                <dd className="mt-1 text-sm font-semibold text-ink dark:text-foreground">
                  {passingScore}%
                </dd>
              </div>
            </dl>
          </article>
        )}
      </div>
    </StudentShell>
  );
}
