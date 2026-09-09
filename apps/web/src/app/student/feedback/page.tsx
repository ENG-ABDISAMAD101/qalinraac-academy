"use client";

import Link from "next/link";
import { Eye, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getApiErrorMessage,
  studentFeedbackRequest,
  type FeedbackListData,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function formatStatus(status: string) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  if (key === "reviewed") return "Reviewed";
  if (key === "need_revision" || key === "failed") return "Need Revision";
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
    return "bg-brand-lime-soft text-brand-navy";
  }
  if (label === "Need Revision") {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-canvas text-brand-navy dark:bg-muted dark:text-foreground";
}

export default function FeedbackPage() {
  const [data, setData] = useState<FeedbackListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");

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
        (item.description?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [data?.items, q, tab]);

  const stats = data?.stats;

  return (
    <StudentShell>
      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Feedback & Discussions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assignment feedback, questions, and reply history
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
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Total Assignments", value: stats?.totalAssignments ?? 0 },
                { label: "Total Quizzes", value: stats?.totalQuizzes ?? 0 },
                { label: "Approved", value: stats?.approved ?? 0 },
                { label: "Need Revision", value: stats?.needRevision ?? 0 },
                { label: "Pending", value: stats?.pending ?? 0 },
              ].map((card) => (
                <div key={card.label} className="card-soft px-4 py-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-brand-navy dark:text-foreground">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              {(["all", "quiz", "assignment"] as const).map((key) => (
                <TabsContent key={key} value={key} className="mt-0 space-y-3">
                  {items.length === 0 ? (
                    <div className="card-soft px-6 py-12 text-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        No feedback items to show.
                      </p>
                    </div>
                  ) : (
                    items.map((item) => {
                      const href =
                        item.kind === "quiz"
                          ? `/student/feedback/quiz/${item.id}`
                          : `/student/feedback/assignment/${item.id}`;
                      return (
                        <article
                          key={`${item.kind}-${item.id}`}
                          className="card-soft p-4 sm:p-5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-brand-navy/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-navy dark:bg-brand-lime/20 dark:text-brand-lime">
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
                              <h2 className="text-base font-bold text-ink dark:text-foreground sm:text-lg">
                                {item.title}
                              </h2>
                              <p className="text-sm text-muted-foreground">
                                {item.description?.trim() ||
                                  `Course · ${item.courseTitle}`}
                              </p>
                            </div>
                            <Button
                              asChild
                              variant="outline"
                              size="icon"
                              className="shrink-0"
                              aria-label={`View ${item.title}`}
                            >
                              <Link href={href}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </div>
    </StudentShell>
  );
}
