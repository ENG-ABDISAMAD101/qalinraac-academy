"use client";

import Link from "next/link";
import { ArrowLeft, Download, Eye } from "lucide-react";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { StudentShell } from "@/components/student/StudentShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  fileDownloadUrl,
  getAccessToken,
  getApiErrorMessage,
  replyAssignmentRequest,
  studentFeedbackAssignmentRequest,
} from "@/lib/api";
import { initialsFromName } from "@/lib/utils";

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

function formatDate(value: unknown) {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function openAuthenticatedFile(fileId: string, download = false) {
  const token = getAccessToken();
  const res = await fetch(fileDownloadUrl(fileId), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  if (download) {
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    a.click();
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

type Message = {
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

export default function FeedbackAssignmentPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = params.id;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [fileError, setFileError] = useState("");

  const load = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError("");
    try {
      const result = await studentFeedbackAssignmentRequest(assignmentId);
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load assignment feedback."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const assignment = asRecord(data?.assignment) ?? data;
  const course = asRecord(data?.course);
  const submission = asRecord(data?.submission);
  const mentor = asRecord(data?.mentor);
  const fileAsset = asRecord(submission?.fileAsset);

  const title = pickString(assignment?.title, "Assignment");
  const description = pickString(
    assignment?.description,
    "No description provided.",
  );
  const courseTitle = pickString(course?.title, data?.courseTitle, "Course");
  const dateLabel = formatDate(
    assignment?.dueAt ??
      submission?.createdAt ??
      assignment?.createdAt ??
      data?.createdAt,
  );

  const mentorFeedback = pickString(
    submission?.feedback,
    mentor?.feedback,
    data?.feedback,
  );

  const messages = useMemo(() => {
    const raw = data?.discussion ?? data?.messages ?? data?.replies;
    if (!Array.isArray(raw)) return [] as Message[];
    return raw.map((item, index) => {
      const row = asRecord(item) ?? {};
      const author = asRecord(row.author) ?? asRecord(row.authorId);
      return {
        id: pickString(row.id, row._id, `msg-${index}`),
        body: pickString(row.body, row.message, row.content),
        createdAt: pickString(row.createdAt),
        author: author
          ? {
              id: pickString(author.id, author._id),
              fullName: pickString(author.fullName, author.name, "User"),
              avatarUrl: pickString(author.avatarUrl) || undefined,
              role: pickString(author.role),
            }
          : null,
      };
    });
  }, [data]);

  const mentorPerson = useMemo(() => {
    if (mentor) {
      return {
        fullName: pickString(mentor.fullName, mentor.name, "Instructor"),
        avatarUrl: pickString(mentor.avatarUrl) || undefined,
      };
    }
    const fromMessages = messages.find((m) => {
      const role = m.author?.role?.toLowerCase() ?? "";
      return (
        role.includes("instructor") ||
        role.includes("academic") ||
        role.includes("admin") ||
        role.includes("mentor")
      );
    });
    if (fromMessages?.author) {
      return {
        fullName: fromMessages.author.fullName ?? "Instructor",
        avatarUrl: fromMessages.author.avatarUrl,
      };
    }
    return { fullName: "Instructor", avatarUrl: undefined as string | undefined };
  }, [mentor, messages]);

  const fileId = pickString(fileAsset?.id, submission?.fileAssetId);
  const fileName = pickString(
    fileAsset?.originalName,
    submission?.fileName,
    "Attachment",
  );
  const contentNotes = pickString(submission?.content, submission?.notes);

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!assignmentId || !reply.trim()) return;
    setSending(true);
    setSendError("");
    try {
      await replyAssignmentRequest(assignmentId, reply.trim());
      setReply("");
      await load();
    } catch (err) {
      setSendError(getApiErrorMessage(err, "Could not send reply."));
    } finally {
      setSending(false);
    }
  }

  async function handleFile(action: "view" | "download") {
    if (!fileId) return;
    setFileError("");
    try {
      await openAuthenticatedFile(fileId, action === "download");
    } catch {
      setFileError("Could not open the file. Try again.");
    }
  }

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
            <Spinner label="Loading assignment" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
            <article className="card-soft space-y-3 p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Assignment
              </p>
              <h1 className="font-display text-2xl font-bold text-primary dark:text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-sm text-muted-foreground">
                <span>
                  Course ·{" "}
                  <span className="font-medium text-ink dark:text-foreground">
                    {courseTitle}
                  </span>
                </span>
                <span>
                  Date ·{" "}
                  <span className="font-medium text-ink dark:text-foreground">
                    {dateLabel}
                  </span>
                </span>
              </div>
            </article>

            <div className="card-soft p-4 sm:p-6">
              <Tabs defaultValue="submission">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="submission" className="flex-1 sm:flex-none">
                    Submission
                  </TabsTrigger>
                  <TabsTrigger value="discussion" className="flex-1 sm:flex-none">
                    Discussion
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="submission" className="space-y-4">
                  {fileError ? (
                    <p className="text-sm text-destructive">{fileError}</p>
                  ) : null}
                  {fileId ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-canvas/60 px-4 py-3 dark:bg-muted/30">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          Submitted file
                        </p>
                        <p className="truncate text-sm font-semibold text-ink dark:text-foreground">
                          {fileName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="View file"
                          onClick={() => void handleFile("view")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Download file"
                          onClick={() => void handleFile("download")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No file was attached to this submission.
                    </p>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-primary dark:text-foreground">
                      Content notes
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-canvas px-4 py-3 text-sm text-muted-foreground dark:bg-muted/40">
                      {contentNotes || "No written notes were submitted."}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="discussion" className="space-y-5">
                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-primary dark:text-foreground">
                      Mentor Feedback
                    </h3>
                    <div className="flex gap-3 rounded-2xl border border-border/70 bg-canvas/50 p-4 dark:bg-muted/30">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage
                          src={mentorPerson.avatarUrl}
                          alt={mentorPerson.fullName}
                        />
                        <AvatarFallback>
                          {initialsFromName(mentorPerson.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink dark:text-foreground">
                          {mentorPerson.fullName}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                          {mentorFeedback ||
                            "No mentor feedback has been posted yet."}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-primary dark:text-foreground">
                      Discussion
                    </h3>
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No discussion messages yet.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {messages.map((m) => (
                          <li
                            key={m.id}
                            className="flex gap-3 rounded-2xl border border-border/60 px-4 py-3"
                          >
                            <Avatar className="h-9 w-9 border border-border">
                              <AvatarImage
                                src={m.author?.avatarUrl}
                                alt={m.author?.fullName ?? "User"}
                              />
                              <AvatarFallback>
                                {initialsFromName(m.author?.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <p className="text-sm font-semibold text-ink dark:text-foreground">
                                  {m.author?.fullName ?? "User"}
                                </p>
                                {m.createdAt ? (
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(m.createdAt)}
                                  </p>
                                ) : null}
                              </div>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                                {m.body}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <form onSubmit={onReply} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="reply">Reply to mentor</Label>
                      <Textarea
                        id="reply"
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Write your reply…"
                        rows={4}
                        required
                      />
                    </div>
                    {sendError ? (
                      <p className="text-sm text-destructive">{sendError}</p>
                    ) : null}
                    <Button type="submit" disabled={sending || !reply.trim()}>
                      {sending ? "Sending…" : "Send reply"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
