"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Clock, PencilRuler } from "lucide-react";
import {
  InstructorShell,
  statusTone,
} from "@/components/instructor/InstructorShell";
import { CourseCurriculumPanel } from "@/components/instructor/CourseCurriculumPanel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  courseCategoryLabel,
  formatMoney,
  getApiErrorMessage,
  instructorCourseDiscussReplyRequest,
  instructorCourseRequest,
  instructorSaveDraftRequest,
  mediaPublicUrl,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

function courseStatusLabel(status: string, displayStatus?: string) {
  if (displayStatus === "Published" || displayStatus === "Draft" || displayStatus === "In Progress") {
    return displayStatus;
  }
  const map: Record<string, string> = {
    draft: "Draft",
    in_progress: "In Progress",
    pending_review: "In Progress",
    published: "Published",
    archived: "Archived",
  };
  return map[status] ?? status;
}

type CourseDetail = Awaited<ReturnType<typeof instructorCourseRequest>>;

export default function InstructorCourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError("");
    try {
      setCourse(await instructorCourseRequest(courseId));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load course."));
      setCourse(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const status = course?.status ?? "";
  const label = courseStatusLabel(status, course?.displayStatus);
  const isPending =
    status === "in_progress" ||
    course?.reviewStatus === "pending_review" ||
    status === "pending_review";
  const isPublished = status === "published" && !course?.liveCourseId;
  const isRevision = Boolean(course?.liveCourseId || course?.isRevisionDraft);
  const canEdit = !isPending && status !== "archived";
  const thumb = mediaPublicUrl(course?.bannerUrl ?? course?.thumbnailUrl);

  async function runAction(
    fn: () => Promise<{ status: string }>,
    successMsg: string,
  ) {
    if (!courseId) return;
    setActionBusy(true);
    setActionError("");
    setActionMsg("");
    try {
      const updated = await fn();
      setCourse((prev) => (prev ? { ...prev, status: updated.status } : prev));
      setActionMsg(successMsg);
      await load();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Action failed."));
    } finally {
      setActionBusy(false);
    }
  }

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!courseId || !reply.trim()) return;
    setSending(true);
    setActionError("");
    try {
      await instructorCourseDiscussReplyRequest(courseId, reply.trim());
      setReply("");
      await load();
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Could not send reply."));
    } finally {
      setSending(false);
    }
  }

  return (
    <InstructorShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/instructor/courses">← Back to My Courses</Link>
        </Button>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading course" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : course ? (
          <>
            <div className="relative aspect-[21/9] overflow-hidden rounded-[1.5rem] bg-muted">
              {thumb ? (
                <Image
                  src={thumb}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-primary/5 text-lg font-semibold text-primary">
                  {course.title}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {[
                    courseCategoryLabel(course.category),
                    course.level,
                    course.language?.toUpperCase(),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {canEdit ? (
                <Button asChild size="lg">
                  <Link href={`/instructor/courses/${course.id}/builder`}>
                    <PencilRuler className="h-4 w-4" />
                    {isPublished
                      ? "Update course"
                      : (course.builderStep ?? 1) > 1
                        ? "Continue Builder"
                        : "Open Builder"}
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" variant="outline">
                  <Link href={`/instructor/courses/${course.id}/builder`}>
                    <PencilRuler className="h-4 w-4" />
                    View Builder
                  </Link>
                </Button>
              )}
            </div>

            {isPending ? (
              <p className="flex items-start gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  <strong className="font-semibold">Pending Academic Review.</strong>{" "}
                  Your course has been submitted for review. You can no longer
                  modify the submitted version until it is returned.
                </span>
              </p>
            ) : null}

            {isRevision ? (
              <p className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                <strong className="font-semibold">Editing Changes.</strong> These
                changes are not live yet. They will be reviewed before being
                published. Students continue seeing the published version.
              </p>
            ) : null}

            {actionError ? (
              <p className="text-sm text-destructive">{actionError}</p>
            ) : null}
            {actionMsg ? (
              <p className="rounded-2xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
                {actionMsg}
              </p>
            ) : null}

            <Tabs defaultValue="course">
              <TabsList>
                <TabsTrigger value="course">Your Course</TabsTrigger>
                <TabsTrigger value="discussions">Discussions</TabsTrigger>
              </TabsList>

              <TabsContent value="course" className="space-y-4">
                <div className="card-soft space-y-4 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
                      {course.title}
                    </h1>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        statusTone(label),
                      )}
                    >
                      {label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {course.students ?? 0} students · {course.lessons ?? 0}{" "}
                    lessons ·{" "}
                    {formatMoney(course.priceCents, course.currency)}
                    {course.level ? ` · ${course.level}` : ""}
                  </p>
                  {course.description ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {course.description}
                    </p>
                  ) : null}
                  {course.rejectionReason ? (
                    <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                      <p className="font-semibold">Rejection feedback</p>
                      <p className="mt-1">{course.rejectionReason}</p>
                    </div>
                  ) : null}

                  {(course.learningOutcomes?.length ?? 0) > 0 ? (
                    <div>
                      <h2 className="text-sm font-bold text-primary dark:text-foreground">
                        What you&apos;ll learn
                      </h2>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        {course.learningOutcomes!.map((o) => (
                          <li key={o}>{o}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <CourseCurriculumPanel curriculum={course.curriculum ?? []} />
                  <div className="flex flex-wrap gap-2 pt-2">
                    {canEdit ? (
                      <>
                        <Button asChild>
                          <Link href={`/instructor/courses/${course.id}/builder`}>
                            <PencilRuler className="h-4 w-4" />
                            {isPublished ? "Update course" : "Continue Builder"}
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={actionBusy}
                          onClick={() =>
                            void runAction(
                              () => instructorSaveDraftRequest(course.id),
                              "Saved as draft.",
                            )
                          }
                        >
                          Save as Draft
                        </Button>
                        <Button asChild variant="secondary">
                          <Link
                            href={`/instructor/courses/${course.id}/builder?step=9`}
                          >
                            Mark Course as Complete
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <Button asChild variant="outline">
                        <Link href={`/instructor/courses/${course.id}/builder`}>
                          <PencilRuler className="h-4 w-4" />
                          View Builder
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="discussions" className="space-y-4">
                <div className="card-soft space-y-4 p-5">
                  <h2 className="text-base font-bold text-primary dark:text-foreground">
                    Course discussions
                  </h2>
                  {(course.discussions?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No messages yet from Academic or Admin.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {course.discussions.map((d) => (
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
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              {d.author?.fullName ?? "Staff"}
                              {d.author?.role ? (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                  {d.author.role}
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {d.body}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {d.createdAt
                                ? new Date(d.createdAt).toLocaleString()
                                : ""}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form onSubmit={onReply} className="space-y-3 border-t border-border pt-4">
                    <Textarea
                      rows={3}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Reply to Academic / Admin…"
                      required
                    />
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
