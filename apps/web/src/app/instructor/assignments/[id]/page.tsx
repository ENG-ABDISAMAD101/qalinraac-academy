"use client";

import Link from "next/link";
import { Download, Eye } from "lucide-react";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorMessage,
  instructorAssignmentDetailRequest,
  instructorAssignmentReplyRequest,
  instructorGradeSubmissionRequest,
  mediaPublicUrl,
  type AssignmentGradeStatus,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

type StudentSub = {
  submissionId: string;
  studentId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  status: string;
  score?: number;
  file?: { id: string; name: string; url?: string } | null;
  submittedAt?: string;
};

type Discussion = {
  id: string;
  body: string;
  createdAt?: string;
  author?: {
    id?: string;
    fullName?: string;
    avatarUrl?: string;
    role?: string;
  } | null;
};

type Detail = {
  id: string;
  title: string;
  description?: string;
  courseTitle?: string;
  lessonTitle?: string;
  students: StudentSub[];
  discussions: Discussion[];
};

function mapStatus(raw: string): AssignmentGradeStatus {
  const s = raw.toLowerCase();
  if (s === "graded" || s === "approved") return "approved";
  if (s === "returned" || s === "need_revision") return "need_revision";
  return "pending";
}

function statusLabel(status: AssignmentGradeStatus) {
  if (status === "approved") return "Approved";
  if (status === "need_revision") return "Need Revision";
  return "Pending";
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

export default function InstructorAssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = params.id;

  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const [review, setReview] = useState<StudentSub | null>(null);
  const [feedback, setFeedback] = useState("");
  const [gradeStatus, setGradeStatus] =
    useState<AssignmentGradeStatus>("pending");
  const [marks, setMarks] = useState("0");
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [gradeError, setGradeError] = useState("");

  const load = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError("");
    try {
      const raw = (await instructorAssignmentDetailRequest(
        assignmentId,
      )) as Detail;
      setData({
        ...raw,
        students: Array.isArray(raw.students) ? raw.students : [],
        discussions: Array.isArray(raw.discussions) ? raw.discussions : [],
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load assignment."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!assignmentId || !reply.trim()) return;
    setSending(true);
    setSendError("");
    try {
      await instructorAssignmentReplyRequest(assignmentId, reply.trim());
      setReply("");
      await load();
    } catch (err) {
      setSendError(getApiErrorMessage(err, "Could not send reply."));
    } finally {
      setSending(false);
    }
  }

  function openReview(s: StudentSub) {
    setReview(s);
    setFeedback("");
    setGradeStatus(mapStatus(s.status));
    setMarks(String(s.score ?? 0));
    setGradeError("");
  }

  async function submitFeedback(e: FormEvent) {
    e.preventDefault();
    if (!review || !assignmentId) return;
    const score = Number(marks);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setGradeError("Marks must be between 0 and 100.");
      return;
    }
    setSubmittingGrade(true);
    setGradeError("");
    try {
      await instructorGradeSubmissionRequest(assignmentId, review.studentId, {
        score,
        feedback: feedback.trim() || undefined,
        status: gradeStatus,
      });
      setReview(null);
      await load();
    } catch (err) {
      setGradeError(getApiErrorMessage(err, "Could not submit feedback."));
    } finally {
      setSubmittingGrade(false);
    }
  }

  const fileUrl = mediaPublicUrl(review?.file?.url);

  return (
    <InstructorShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/instructor/assignments">← Back to Assignments</Link>
        </Button>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading assignment" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : data ? (
          <>
            <div>
              <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
                {data.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.courseTitle}
                {data.lessonTitle ? ` · ${data.lessonTitle}` : ""}
              </p>
              {data.description ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {data.description}
                </p>
              ) : null}
            </div>

            <Tabs defaultValue="students">
              <TabsList>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="discussions">Discussions</TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="space-y-3">
                {data.students.length === 0 ? (
                  <div className="card-soft px-5 py-10 text-center text-sm text-muted-foreground">
                    No submissions yet.
                  </div>
                ) : (
                  data.students.map((s) => {
                    const status = mapStatus(s.status);
                    return (
                      <article
                        key={s.submissionId}
                        className="card-soft flex flex-wrap items-center justify-between gap-4 p-5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage
                              src={mediaPublicUrl(s.avatarUrl)}
                              alt=""
                            />
                            <AvatarFallback>
                              {initialsFromName(s.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold">{s.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(s.submittedAt)}
                              {s.file?.name ? ` · ${s.file.name}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[10px] font-bold",
                              status === "approved"
                                ? "bg-muted text-foreground"
                                : status === "need_revision"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted text-muted-foreground",
                            )}
                          >
                            {statusLabel(status)}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => openReview(s)}
                          >
                            Review
                          </Button>
                        </div>
                      </article>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="discussions" className="space-y-4">
                <div className="card-soft space-y-4 p-5">
                  {data.discussions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No discussion messages yet.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {data.discussions.map((d) => (
                        <li
                          key={d.id}
                          className="flex gap-3 rounded-2xl border border-border/70 px-4 py-3"
                        >
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage
                              src={mediaPublicUrl(d.author?.avatarUrl)}
                              alt=""
                            />
                            <AvatarFallback>
                              {initialsFromName(d.author?.fullName ?? "?")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">
                              {d.author?.fullName ?? "User"}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {d.body}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form
                    onSubmit={onReply}
                    className="space-y-3 border-t border-border pt-4"
                  >
                    <Textarea
                      rows={3}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a reply…"
                      required
                    />
                    {sendError ? (
                      <p className="text-sm text-destructive">{sendError}</p>
                    ) : null}
                    <Button type="submit" disabled={sending || !reply.trim()}>
                      {sending ? (
                        <Spinner className="sm on-primary" label="Sending" />
                      ) : null}
                      Send reply
                    </Button>
                  </form>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </div>

      <Dialog
        open={Boolean(review)}
        onOpenChange={(open) => {
          if (!open) setReview(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review submission</DialogTitle>
            <DialogDescription>
              Leave overall feedback and set status.
            </DialogDescription>
          </DialogHeader>
          {review ? (
            <form onSubmit={submitFeedback} className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-border">
                  <AvatarImage src={mediaPublicUrl(review.avatarUrl)} alt="" />
                  <AvatarFallback>{initialsFromName(review.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">{review.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {data?.courseTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(review.submittedAt)}
                  </p>
                </div>
              </div>

              {review.file && fileUrl ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-4 py-3">
                  <p className="truncate text-sm font-medium">{review.file.name}</p>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </a>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <a href={fileUrl} download={review.file.name}>
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
                <Label htmlFor="detail-feedback">Overall feedback</Label>
                <Textarea
                  id="detail-feedback"
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="detail-status">Status</Label>
                  <select
                    id="detail-status"
                    value={gradeStatus}
                    onChange={(e) =>
                      setGradeStatus(e.target.value as AssignmentGradeStatus)
                    }
                    className={formSelectClassName}
                  >
                    <option value="pending">Pending</option>
                    <option value="need_revision">Need Revision</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detail-marks">Marks (0–100)</Label>
                  <Input
                    id="detail-marks"
                    type="number"
                    min={0}
                    max={100}
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    required
                  />
                </div>
              </div>

              {gradeError ? (
                <p className="text-sm text-destructive">{gradeError}</p>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReview(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingGrade}>
                  {submittingGrade ? "Submitting…" : "Submit feedback"}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </InstructorShell>
  );
}
