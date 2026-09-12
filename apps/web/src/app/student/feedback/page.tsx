"use client";

import Link from "next/link";
import { Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getApiErrorMessage,
  studentFeedbackRequest,
  type FeedbackListData,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function formatStatus(status: string) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  if (key === "reviewed") return "Reviewed";
  if (key === "need_revision") return "Need Revision";
  if (key === "failed") return "Failed";
  if (key === "passed") return "Passed";
  if (key === "pending" || key === "submitted") return "Pending";
  return status
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function statusTone(status: string) {
  const label = formatStatus(status);
  if (label === "Passed" || label === "Reviewed") {
    return "bg-muted text-foreground";
  }
  if (label === "Need Revision" || label === "Failed") {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-canvas text-primary dark:bg-muted dark:text-foreground";
}

export default function FeedbackPage() {
  const [data, setData] = useState<FeedbackListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await studentFeedbackRequest();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load feedback."));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => {
    const list = data?.items ?? [];
    const needle = q.trim().toLowerCase();
    return list.filter((item) => {
      if (tab === "quiz" && item.kind !== "quiz") return false;
      if (tab === "assignment" && item.kind !== "assignment") return false;
      if (!needle) return true;
      return (
        item.title.toLowerCase().includes(needle) ||
        item.courseTitle.toLowerCase().includes(needle) ||
        (item.lessonTitle?.toLowerCase().includes(needle) ?? false) ||
        (item.description?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [data?.items, q, tab]);

  const stats = data?.stats;

  return (
    <StudentShell>
      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Feedback & Discussions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assignment feedback, quizzes, and reply history
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search feedback"
              className="pl-11"
            />
          </div>
          <Tabs value={tab} onValueChange={setTab} className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all" className="flex-1 sm:flex-none">
                All
              </TabsTrigger>
              <TabsTrigger value="quiz" className="flex-1 sm:flex-none">
                Quiz
              </TabsTrigger>
              <TabsTrigger value="assignment" className="flex-1 sm:flex-none">
                Assignment
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="flex min-h-[14rem] items-center justify-center">
            <Spinner label="Loading feedback" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {[
                { label: "Total Assignments", value: stats?.totalAssignments ?? 0 },
                { label: "Total Quizzes", value: stats?.totalQuizzes ?? 0 },
                { label: "Approved", value: stats?.approved ?? 0 },
                { label: "Need Revision", value: stats?.needRevision ?? 0 },
                { label: "Pending", value: stats?.pending ?? 0 },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl border border-border bg-card px-4 py-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-primary dark:text-foreground">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {items.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  No feedback items to show.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const key = `${item.kind}-${item.id}`;
                  const open = openId === key;

                  return (
                    <article
                      key={key}
                      className="overflow-hidden rounded-2xl border border-border bg-card"
                    >
                      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-foreground">
                              {item.kind === "quiz" ? "Quiz" : "Assignment"}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                                statusTone(item.status),
                              )}
                            >
                              {formatStatus(item.status)}
                            </span>
                          </div>
                          <h2 className="text-base font-bold text-foreground sm:text-lg">
                            {item.title}
                          </h2>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0 rounded-xl"
                          aria-label={open ? "Collapse" : "Expand"}
                          aria-expanded={open}
                          onClick={() => setOpenId(open ? null : key)}
                        >
                          {open ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div
                        className={cn(
                          "grid transition-[grid-template-rows] duration-200",
                          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="border-t border-border px-4 pb-5 pt-4 sm:px-5">
                            {item.kind === "quiz" ? (
                              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Course name
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">
                                    {item.courseTitle}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Lesson name
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">
                                    {item.lessonTitle ?? "—"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Questions
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">
                                    {item.questionCount ?? 0}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Passing score
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">
                                    {item.passingScore != null
                                      ? `${item.passingScore}%`
                                      : "—"}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Course name
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">
                                    {item.courseTitle}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                    Lesson name
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-foreground">
                                    {item.lessonTitle ?? "—"}
                                  </p>
                                </div>
                                <div className="sm:col-span-2">
                                  <Button asChild size="sm" className="rounded-xl">
                                    <Link
                                      href={`/student/feedback/assignment/${item.id}`}
                                    >
                                      Open details
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </StudentShell>
  );
}
