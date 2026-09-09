"use client";

import Link from "next/link";
import { Download, Eye } from "lucide-react";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { InstructorShell } from "@/components/instructor/InstructorShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorMessage,
  instructorAssignmentDetailRequest,
  instructorAssignmentReplyRequest,
  mediaPublicUrl,
} from "@/lib/api";
import { initialsFromName } from "@/lib/utils";

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

export default function InstructorAssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const assignmentId = params.id;

  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

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
                    const fileUrl = mediaPublicUrl(s.file?.url);
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
                              {data.lessonTitle || "Lesson"}
                              {s.file?.name ? ` · ${s.file.name}` : ""}
                            </p>
                          </div>
                        </div>
                        {s.file && fileUrl ? (
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
                              <a href={fileUrl} download={s.file.name}>
                                <Download className="h-4 w-4" />
                                Download
                              </a>
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No file attached
                          </p>
                        )}
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
    </InstructorShell>
  );
}
