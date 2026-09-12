"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Download,
  Eye,
  HelpCircle,
  Search,
} from "lucide-react";
import { InstructorShell } from "@/components/instructor/InstructorShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formSelectClassName } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorMessage,
  instructorAssignmentDetailRequest,
  instructorAssignmentsRequest,
  instructorGradeSubmissionRequest,
  instructorQuizResultsRequest,
  instructorQuizzesRequest,
  instructorReviewQuizAttemptRequest,
  mediaPublicUrl,
  type AssignmentGradeStatus,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

type KindFilter = "all" | "assignment" | "quiz";

type FeedItem = {
  key: string;
  kind: "assignment" | "quiz";
  studentName: string;
  avatarUrl?: string;
  title: string;
  courseTitle: string;
  lessonTitle?: string;
  submittedAt?: string;
  statusLabel: string;
  statusTone: "pending" | "ok" | "warn" | "fail";
  // assignment
  assignmentId?: string;
  studentId?: string;
  submissionId?: string;
  file?: { id: string; name: string; url?: string } | null;
  score?: number;
  // quiz
  quizId?: string;
  attemptId?: string;
  quizScore?: number;
  passed?: boolean;
  reviewStatus?: string;
  instructorFeedback?: string;
};

function mapAssignmentStatus(raw: string): AssignmentGradeStatus {
  const s = raw.toLowerCase();
  if (s === "graded" || s === "approved") return "approved";
  if (s === "returned" || s === "need_revision") return "need_revision";
  return "pending";
}

function assignmentStatusMeta(status: AssignmentGradeStatus) {
  if (status === "approved") {
    return { label: "Approved", tone: "ok" as const };
  }
  if (status === "need_revision") {
    return { label: "Need Revision", tone: "warn" as const };
  }
  return { label: "Pending", tone: "pending" as const };
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toneClass(tone: FeedItem["statusTone"]) {
  if (tone === "ok") return "bg-muted text-foreground";
  if (tone === "warn") return "bg-destructive/10 text-destructive";
  if (tone === "fail") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground dark:bg-[#1A1A1A]";
}

export default function InstructorSubmissionsPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");

  const [assignmentReview, setAssignmentReview] = useState<FeedItem | null>(
    null,
  );
  const [assignmentFeedback, setAssignmentFeedback] = useState("");
  const [assignmentStatus, setAssignmentStatus] =
    useState<AssignmentGradeStatus>("pending");
  const [assignmentMarks, setAssignmentMarks] = useState("0");
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");

  const [quizReview, setQuizReview] = useState<FeedItem | null>(null);
  const [quizFeedback, setQuizFeedback] = useState("");
  const [allowRetake, setAllowRetake] = useState(false);
  const [quizBusy, setQuizBusy] = useState(false);
  const [quizError, setQuizError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [assignmentsData, quizzesData] = await Promise.all([
        instructorAssignmentsRequest(),
        instructorQuizzesRequest(),
      ]);

      const assignmentCards = (
        await Promise.all(
          assignmentsData.items.map(async (a) => {
            try {
              const raw = (await instructorAssignmentDetailRequest(a.id)) as {
                students?: Array<{
                  submissionId: string;
                  studentId: string;
                  name: string;
                  avatarUrl?: string;
                  status: string;
                  score?: number;
                  file?: { id: string; name: string; url?: string } | null;
                  submittedAt?: string;
                }>;
              };
              const students = Array.isArray(raw.students) ? raw.students : [];
              return students
                .filter((s) => Boolean(s.submissionId))
                .map((s) => {
                  const status = mapAssignmentStatus(s.status);
                  const meta = assignmentStatusMeta(status);
                  return {
                    key: `a-${a.id}-${s.submissionId}`,
                    kind: "assignment" as const,
                    studentName: s.name,
                    avatarUrl: s.avatarUrl,
                    title: a.title,
                    courseTitle: a.courseTitle,
                    lessonTitle: a.lessonTitle,
                    submittedAt: s.submittedAt,
                    statusLabel: meta.label,
                    statusTone: meta.tone,
                    assignmentId: a.id,
                    studentId: s.studentId,
                    submissionId: s.submissionId,
                    file: s.file,
                    score: s.score,
                  } satisfies FeedItem;
                });
            } catch {
              return [] as FeedItem[];
            }
          }),
        )
      ).flat();

      const quizCards = (
        await Promise.all(
          quizzesData.items.map(async (quiz) => {
            try {
              const raw = (await instructorQuizResultsRequest(quiz.id)) as {
                results?: Array<{
                  id: string;
                  name: string;
                  avatarUrl?: string;
                  score: number;
                  passed: boolean;
                  reviewStatus?: string;
                  instructorFeedback?: string;
                  createdAt?: string;
                }>;
              };
              const rows = Array.isArray(raw.results) ? raw.results : [];
              return rows.map((r) => {
                const pendingReview =
                  !r.passed &&
                  (r.reviewStatus === "pending_review" || !r.reviewStatus);
                return {
                  key: `q-${quiz.id}-${r.id}`,
                  kind: "quiz" as const,
                  studentName: r.name,
                  avatarUrl: r.avatarUrl,
                  title: quiz.title,
                  courseTitle: quiz.courseTitle,
                  submittedAt: r.createdAt,
                  statusLabel: r.passed
                    ? "Passed"
                    : pendingReview
                      ? "Needs review"
                      : r.reviewStatus === "retake_allowed"
                        ? "Retake allowed"
                        : "Failed",
                  statusTone: r.passed
                    ? "ok"
                    : pendingReview
                      ? "pending"
                      : "fail",
                  quizId: quiz.id,
                  attemptId: r.id,
                  quizScore: r.score,
                  passed: r.passed,
                  reviewStatus: r.reviewStatus,
                  instructorFeedback: r.instructorFeedback,
                } satisfies FeedItem;
              });
            } catch {
              return [] as FeedItem[];
            }
          }),
        )
      ).flat();

      const merged = [...assignmentCards, ...quizCards].sort((a, b) => {
        const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return tb - ta;
      });
      setItems(merged);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load student submissions."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const assignments = items.filter((i) => i.kind === "assignment").length;
    const quizzes = items.filter((i) => i.kind === "quiz").length;
    const needsAttention = items.filter(
      (i) =>
        (i.kind === "assignment" && i.statusTone === "pending") ||
        (i.kind === "quiz" && i.statusTone === "pending"),
    ).length;
    return {
      total: items.length,
      assignments,
      quizzes,
      needsAttention,
    };
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (kind !== "all") list = list.filter((i) => i.kind === kind);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.studentName.toLowerCase().includes(needle) ||
          i.title.toLowerCase().includes(needle) ||
          i.courseTitle.toLowerCase().includes(needle) ||
          (i.lessonTitle ?? "").toLowerCase().includes(needle),
      );
    }
    return list;
  }, [items, kind, q]);

  function openAssignmentReview(item: FeedItem) {
    setAssignmentReview(item);
    setAssignmentFeedback("");
    setAssignmentStatus(
      item.statusLabel === "Approved"
        ? "approved"
        : item.statusLabel === "Need Revision"
          ? "need_revision"
          : "pending",
    );
    setAssignmentMarks(String(item.score ?? 0));
    setAssignmentError("");
  }

  function openQuizReview(item: FeedItem) {
    setQuizReview(item);
    setQuizFeedback(item.instructorFeedback ?? "");
    setAllowRetake(item.reviewStatus === "retake_allowed");
    setQuizError("");
  }

  async function submitAssignmentFeedback(e: FormEvent) {
    e.preventDefault();
    if (!assignmentReview?.assignmentId || !assignmentReview.studentId) return;
    const score = Number(assignmentMarks);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setAssignmentError("Marks must be between 0 and 100.");
      return;
    }
    setAssignmentBusy(true);
    setAssignmentError("");
    try {
      await instructorGradeSubmissionRequest(
        assignmentReview.assignmentId,
        assignmentReview.studentId,
        {
          score,
          feedback: assignmentFeedback.trim() || undefined,
          status: assignmentStatus,
        },
      );
      setAssignmentReview(null);
      await load();
    } catch (err) {
      setAssignmentError(
        getApiErrorMessage(err, "Could not submit assignment feedback."),
      );
    } finally {
      setAssignmentBusy(false);
    }
  }

  async function submitQuizFeedback(e: FormEvent) {
    e.preventDefault();
    if (!quizReview?.quizId || !quizReview.attemptId) return;
    setQuizBusy(true);
    setQuizError("");
    try {
      await instructorReviewQuizAttemptRequest(
        quizReview.quizId,
        quizReview.attemptId,
        {
          feedback: quizFeedback.trim() || undefined,
          allowRetake,
        },
      );
      setQuizReview(null);
      await load();
    } catch (err) {
      setQuizError(getApiErrorMessage(err, "Could not submit quiz feedback."));
    } finally {
      setQuizBusy(false);
    }
  }

  const assignmentFileUrl = mediaPublicUrl(assignmentReview?.file?.url);

  return (
    <InstructorShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Student submissions
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Student submissions are reviewed here — assignment uploads and
              quiz attempts in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/instructor/assignments">Manage assignments</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/instructor/quizzes">Manage quizzes</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total", value: stats.total },
            { label: "Assignments", value: stats.assignments },
            { label: "Quizzes", value: stats.quizzes },
            { label: "Needs attention", value: stats.needsAttention },
          ].map((card) => (
            <div key={card.label} className="card-soft px-4 py-4">
              <p className="text-xs font-medium text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs
            value={kind}
            onValueChange={(v) => setKind(v as KindFilter)}
            className="w-full sm:w-auto"
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="all" className="flex-1 sm:flex-none">
                All
              </TabsTrigger>
              <TabsTrigger value="assignment" className="flex-1 sm:flex-none">
                Assignments
              </TabsTrigger>
              <TabsTrigger value="quiz" className="flex-1 sm:flex-none">
                Quizzes
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <label className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search student, title, or course"
              className="pl-11"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex min-h-[14rem] items-center justify-center">
            <Spinner label="Loading submissions" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : filtered.length === 0 ? (
          <div className="card-soft px-6 py-14 text-center">
            <h2 className="font-display text-xl font-bold text-primary dark:text-foreground">
              No submissions yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {items.length === 0
                ? "When students submit assignments or complete quizzes, their work will appear here for review. Create work on the Assignments or Quizzes pages first."
                : "No submissions match your filters."}
            </p>
            {items.length === 0 ? (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/instructor/assignments">Go to Assignments</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/instructor/quizzes">Go to Quizzes</Link>
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <article
                key={item.key}
                className="card-soft flex flex-wrap items-center justify-between gap-4 p-5 transition-colors hover:border-primary/20"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar className="h-11 w-11 border border-border">
                    <AvatarImage
                      src={mediaPublicUrl(item.avatarUrl)}
                      alt=""
                    />
                    <AvatarFallback>
                      {initialsFromName(item.studentName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          item.kind === "assignment"
                            ? "bg-muted text-foreground dark:bg-[#1A1A1A]"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        {item.kind === "assignment" ? (
                          <ClipboardList className="h-3 w-3" />
                        ) : (
                          <HelpCircle className="h-3 w-3" />
                        )}
                        {item.kind === "assignment" ? "Assignment" : "Quiz"}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                          toneClass(item.statusTone),
                        )}
                      >
                        {item.statusLabel}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground">
                      {item.studentName}
                    </p>
                    <p className="text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.courseTitle}
                      {item.lessonTitle ? ` · ${item.lessonTitle}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.kind === "quiz" && item.quizScore != null
                        ? `Score ${item.quizScore}% · `
                        : ""}
                      {formatDateTime(item.submittedAt)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    item.kind === "assignment"
                      ? openAssignmentReview(item)
                      : openQuizReview(item)
                  }
                >
                  Review
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(assignmentReview)}
        onOpenChange={(open) => {
          if (!open) setAssignmentReview(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review assignment</DialogTitle>
            <DialogDescription>
              Provide feedback and update submission status.
            </DialogDescription>
          </DialogHeader>
          {assignmentReview ? (
            <form onSubmit={submitAssignmentFeedback} className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage
                    src={mediaPublicUrl(assignmentReview.avatarUrl)}
                    alt=""
                  />
                  <AvatarFallback>
                    {initialsFromName(assignmentReview.studentName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">
                    {assignmentReview.studentName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {assignmentReview.courseTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(assignmentReview.submittedAt)}
                  </p>
                </div>
              </div>

              {assignmentReview.file && assignmentFileUrl ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-4 py-3">
                  <p className="truncate text-sm font-medium text-foreground">
                    {assignmentReview.file.name}
                  </p>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={assignmentFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={assignmentFileUrl}
                        download={assignmentReview.file.name}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No file attached</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="sub-a-feedback">Overall feedback</Label>
                <Textarea
                  id="sub-a-feedback"
                  rows={4}
                  value={assignmentFeedback}
                  onChange={(e) => setAssignmentFeedback(e.target.value)}
                  placeholder="Write feedback for the student…"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sub-a-status">Status</Label>
                  <select
                    id="sub-a-status"
                    value={assignmentStatus}
                    onChange={(e) =>
                      setAssignmentStatus(
                        e.target.value as AssignmentGradeStatus,
                      )
                    }
                    className={formSelectClassName}
                  >
                    <option value="pending">Pending</option>
                    <option value="need_revision">Need Revision</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub-a-marks">Marks (0–100)</Label>
                  <Input
                    id="sub-a-marks"
                    type="number"
                    min={0}
                    max={100}
                    value={assignmentMarks}
                    onChange={(e) => setAssignmentMarks(e.target.value)}
                    required
                  />
                </div>
              </div>

              {assignmentError ? (
                <p className="text-sm text-destructive">{assignmentError}</p>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssignmentReview(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={assignmentBusy}>
                  {assignmentBusy ? "Submitting…" : "Submit feedback"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(quizReview)}
        onOpenChange={(open) => {
          if (!open) setQuizReview(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review quiz attempt</DialogTitle>
            <DialogDescription>
              Share feedback and optionally allow another attempt.
            </DialogDescription>
          </DialogHeader>
          {quizReview ? (
            <form onSubmit={submitQuizFeedback} className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage
                    src={mediaPublicUrl(quizReview.avatarUrl)}
                    alt=""
                  />
                  <AvatarFallback>
                    {initialsFromName(quizReview.studentName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">
                    {quizReview.studentName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {quizReview.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quizReview.courseTitle}
                    {quizReview.quizScore != null
                      ? ` · Score ${quizReview.quizScore}%`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sub-q-feedback">Overall feedback</Label>
                <Textarea
                  id="sub-q-feedback"
                  rows={4}
                  value={quizFeedback}
                  onChange={(e) => setQuizFeedback(e.target.value)}
                  placeholder="Write feedback for the student…"
                />
              </div>

              {!quizReview.passed ? (
                <label className="flex items-start gap-3 text-sm leading-snug">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-border"
                    checked={allowRetake}
                    onChange={(e) => setAllowRetake(e.target.checked)}
                  />
                  <span>
                    Allow this student to retake the quiz. They can attempt once
                    more after you submit.
                  </span>
                </label>
              ) : null}

              {quizError ? (
                <p className="text-sm text-destructive">{quizError}</p>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setQuizReview(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={quizBusy}>
                  {quizBusy ? "Submitting…" : "Submit feedback"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </InstructorShell>
  );
}
