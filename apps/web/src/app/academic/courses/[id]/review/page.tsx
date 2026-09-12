"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Info, MessageSquare, UserRound } from "lucide-react";
import { AcademicShell } from "@/components/academic/AcademicShell";
import { CourseCurriculumPanel } from "@/components/instructor/CourseCurriculumPanel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge, courseStatusBadgeVariant } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  academicCourseReviewRequest,
  academicReplyCourseDiscussionRequest,
  academicSetCourseStatusRequest,
  courseCategoryLabel,
  getApiErrorMessage,
  mediaPublicUrl,
  type InstructorModule,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const COMPLETE_DURATION_MS = 60_000;

type LessonRow = {
  id?: string;
  title?: string;
  description?: string;
  videoUrl?: string;
  durationMinutes?: number;
  order?: number;
  isPreview?: boolean;
};

type CurriculumModule = {
  id?: string;
  title: string;
  description?: string;
  order?: number;
  lessons?: LessonRow[];
};

type InstructorLite = {
  id?: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
};

type DiscussionRow = {
  id: string;
  body: string;
  authorName?: string;
  authorRole?: string;
  createdAt?: string;
};

type CourseReviewPayload = {
  course?: {
    id?: string;
    title?: string;
    status?: string;
    reviewStatus?: string;
    isRevision?: boolean;
    liveCourseId?: string;
    category?: string;
    level?: string;
    language?: string;
    priceCents?: number;
    currency?: string;
    description?: string;
    thumbnailUrl?: string;
    bannerUrl?: string;
    accessDuration?: string;
    learningOutcomes?: string[];
    instructors?: InstructorLite[];
  };
  curriculum?: CurriculumModule[];
  publishedVersion?: {
    id: string;
    title: string;
    description?: string;
    learningOutcomes?: string[];
  } | null;
  changeSummary?: string[];
  counts?: { modules?: number; lessons?: number };
  discussions?: DiscussionRow[];
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  in_progress: "Pending Review",
  pending_review: "Pending Review",
  published: "Published",
  archived: "Archived",
};

function accessLabel(value?: string) {
  if (value === "6_months") return "6 months";
  if (value === "1_year") return "1 year";
  if (value === "lifetime") return "Lifetime";
  return value ?? "—";
}

function toCurriculumPanel(modules: CurriculumModule[]): InstructorModule[] {
  return modules.map((m, i) => ({
    id: m.id ?? `mod-${i}`,
    title: m.title,
    description: m.description,
    order: m.order ?? i + 1,
    lessons: (m.lessons ?? []).map((l, li) => ({
      id: l.id ?? `lesson-${i}-${li}`,
      title: l.title ?? "Lesson",
      description: l.description,
      videoUrl: l.videoUrl,
      durationMinutes: l.durationMinutes,
      order: l.order ?? li + 1,
      isPreview: l.isPreview,
      moduleId: m.id,
    })),
  }));
}

export default function AcademicCourseReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params.id;

  const [data, setData] = useState<CourseReviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveAs, setSaveAs] = useState<"draft" | "published">("published");
  const [draftReason, setDraftReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDone, setProgressDone] = useState(false);
  const [progressError, setProgressError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reply, setReply] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyError, setReplyError] = useState("");
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const submitStartedRef = useRef(false);

  const progressLocked =
    progressOpen && submitting && !progressDone && !progressError;

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError("");
    try {
      const res = (await academicCourseReviewRequest(
        courseId,
      )) as CourseReviewPayload;
      setData(res);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load course."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [load]);

  function resetProgress() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startedAtRef.current = null;
    submitStartedRef.current = false;
    setProgress(0);
    setProgressDone(false);
    setProgressError("");
    setSubmitting(false);
  }

  function cancelProgress() {
    if (progressLocked) return;
    cancelledRef.current = true;
    resetProgress();
    setProgressOpen(false);
  }

  function openConfirm() {
    if (saveAs === "draft" && !draftReason.trim()) {
      setProgressError("");
      setReplyError("Feedback is required when saving as Draft.");
      return;
    }
    setReplyError("");
    cancelledRef.current = false;
    resetProgress();
    setConfirmOpen(true);
  }

  function startProgressFlow() {
    cancelledRef.current = false;
    submitStartedRef.current = false;
    setConfirmOpen(false);
    setProgressOpen(true);
    setProgress(0);
    setProgressDone(false);
    setProgressError("");
    setSubmitting(false);
    startedAtRef.current = performance.now();

    const finish = async () => {
      if (cancelledRef.current || submitStartedRef.current || !courseId) return;
      submitStartedRef.current = true;
      setProgress(100);
      setSubmitting(true);
      try {
        await academicSetCourseStatusRequest(
          courseId,
          saveAs,
          saveAs === "draft" ? draftReason.trim() : undefined,
        );
        if (cancelledRef.current) {
          resetProgress();
          setProgressOpen(false);
          return;
        }
        setProgressDone(true);
        await load();
      } catch (err) {
        if (cancelledRef.current) {
          resetProgress();
          setProgressOpen(false);
          return;
        }
        setProgressError(
          getApiErrorMessage(err, "Could not update course status."),
        );
      } finally {
        setSubmitting(false);
      }
    };

    const tick = (now: number) => {
      if (cancelledRef.current) return;
      const started = startedAtRef.current ?? now;
      const elapsed = now - started;
      setProgress(Math.min(100, (elapsed / COMPLETE_DURATION_MS) * 100));
      if (elapsed >= COMPLETE_DURATION_MS) {
        void finish();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!courseId || !reply.trim()) return;
    setReplyBusy(true);
    setReplyError("");
    try {
      await academicReplyCourseDiscussionRequest(courseId, reply.trim());
      setReply("");
      await load();
    } catch (err) {
      setReplyError(getApiErrorMessage(err, "Could not send reply."));
    } finally {
      setReplyBusy(false);
    }
  }

  const course = data?.course;
  const title = course?.title ?? "Course";
  const status = course?.status ?? "";
  const isRevision = Boolean(course?.isRevision);
  const statusLabel = isRevision
    ? "Pending Changes"
    : (STATUS_LABEL[status] ?? status);
  const changeSummary = data?.changeSummary ?? [];
  const thumb = mediaPublicUrl(course?.bannerUrl ?? course?.thumbnailUrl);
  const price =
    (course?.priceCents ?? 0) === 0
      ? "Free"
      : `$${((course?.priceCents ?? 0) / 100).toFixed(0)}`;
  const outcomes = course?.learningOutcomes ?? [];
  const instructors = course?.instructors ?? [];
  const discussions = data?.discussions ?? [];
  const panelCurriculum = useMemo(
    () => toCurriculumPanel(data?.curriculum ?? []),
    [data?.curriculum],
  );

  return (
    <AcademicShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/academic/courses">← Courses</Link>
          </Button>
          {!loading && course ? (
            <Badge variant={courseStatusBadgeVariant(status)}>
              {statusLabel}
            </Badge>
          ) : null}
        </div>

        {loading ? (
          <div className="flex min-h-[16rem] items-center justify-center">
            <Spinner label="Loading course" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <>
            {/* Thumbnail-first hero; meta cards overlap bottom edge */}
            <section className="relative pb-24 sm:pb-20">
              <div className="relative aspect-[21/9] min-h-[220px] w-full overflow-hidden rounded-[1.75rem] border border-border/60 bg-muted sm:min-h-[280px]">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={title}
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-primary px-6 text-center text-primary-foreground">
                    <p className="font-display text-2xl font-bold text-white">
                      {title}
                    </p>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent" />
                {course?.category ? (
                  <span className="absolute left-4 top-4 rounded-full bg-background/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary shadow-sm backdrop-blur">
                    {courseCategoryLabel(course.category) || course.category}
                  </span>
                ) : null}
              </div>

              <div className="absolute inset-x-4 bottom-0 grid gap-3 sm:inset-x-6 sm:grid-cols-[1.4fr_auto] lg:inset-x-8">
                <div className="rounded-3xl border border-border/70 bg-background/95 p-5 shadow-lg backdrop-blur-md dark:bg-background/90">
                  <h1 className="font-display text-2xl font-bold text-primary dark:text-foreground sm:text-3xl">
                    {title}
                  </h1>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {course?.description || "No description provided."}
                  </p>
                  {outcomes.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        What you&apos;ll learn
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {outcomes.slice(0, 6).map((o) => (
                          <li key={o}>
                            <Badge variant="lime" className="normal-case">
                              {o}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="grid min-w-[12rem] grid-cols-2 gap-2 sm:min-w-[16rem] sm:grid-cols-1">
                  <div className="rounded-3xl border border-border/70 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Price
                    </p>
                    <p className="mt-0.5 text-2xl font-bold text-primary">
                      {price}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/70 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Lessons
                        </p>
                        <p className="text-xl font-bold">
                          {data?.counts?.lessons ?? 0}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Access
                        </p>
                        <p className="text-sm font-bold">
                          {accessLabel(course?.accessDuration)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {course?.level ? (
                        <Badge variant="muted" className="normal-case capitalize">
                          {course.level}
                        </Badge>
                      ) : null}
                      {course?.language ? (
                        <Badge variant="outline" className="uppercase">
                          {course.language}
                        </Badge>
                      ) : null}
                      <Badge variant="outline" className="normal-case">
                        {data?.counts?.modules ?? 0}{" "}
                        {(data?.counts?.modules ?? 0) === 1
                          ? "section"
                          : "sections"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="card-soft overflow-hidden">
                <Tabs defaultValue="curriculum" className="w-full">
                  <div className="border-b border-border/70 px-4 pt-4">
                    <TabsList>
                      <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                      <TabsTrigger value="instructor">
                        <UserRound className="mr-1.5 h-3.5 w-3.5" />
                        Instructor
                      </TabsTrigger>
                      <TabsTrigger value="discussions">
                        <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                        Discussions
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="curriculum" className="p-5">
                    <CourseCurriculumPanel curriculum={panelCurriculum} />
                  </TabsContent>

                  <TabsContent value="instructor" className="space-y-4 p-5">
                    {instructors.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No instructor assigned.
                      </p>
                    ) : (
                      instructors.map((ins) => (
                        <div
                          key={ins.id ?? ins.email}
                          className="flex items-center gap-3 rounded-2xl border border-border/60 px-4 py-3"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={mediaPublicUrl(ins.avatarUrl)}
                              alt=""
                            />
                            <AvatarFallback>
                              {(ins.fullName ?? "I").slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-primary dark:text-foreground">
                              {ins.fullName ?? "Instructor"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {ins.email}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="discussions" className="space-y-4 p-5">
                    {discussions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No messages yet. Reply to start the review discussion.
                      </p>
                    ) : (
                      discussions.map((d) => (
                        <div
                          key={d.id}
                          className="rounded-2xl border border-border/70 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>
                                {(d.authorName ?? "U")
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">
                                {d.authorName ?? "User"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {d.authorRole}
                                {d.createdAt
                                  ? ` · ${new Date(d.createdAt).toLocaleString()}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed">
                            {d.body}
                          </p>
                        </div>
                      ))
                    )}

                    <form onSubmit={onReply} className="space-y-3 border-t border-border/60 pt-4">
                      <p className="text-sm font-semibold text-primary dark:text-foreground">
                        Reply to instructor
                      </p>
                      <Textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Write feedback or a question for the instructor…"
                        rows={4}
                        required
                      />
                      {replyError ? (
                        <p className="text-sm text-destructive">{replyError}</p>
                      ) : null}
                      <Button
                        type="submit"
                        disabled={replyBusy || !reply.trim()}
                      >
                        {replyBusy ? (
                          <Spinner className="sm on-primary" label="Sending" />
                        ) : null}
                        Send reply
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>

              <aside className="card-soft h-fit space-y-5 p-5">
                <div>
                  <h2 className="text-base font-bold text-primary dark:text-foreground">
                    {isRevision ? "Review changes" : "Save as"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isRevision
                      ? "Publish changes onto the live course, or return them to Draft with feedback."
                      : "Publish the course for students, or return it to Draft with required feedback."}
                  </p>
                </div>

                {isRevision && changeSummary.length > 0 ? (
                  <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Proposed changes
                    </p>
                    <ul className="mt-2 space-y-1.5 text-sm text-foreground">
                      {changeSummary.map((line) => (
                        <li key={line} className="font-medium">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["draft", isRevision ? "Save Changes as Draft" : "Save as Draft"],
                      [
                        "published",
                        isRevision ? "Publish Changes" : "Publish Course",
                      ],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSaveAs(value)}
                      className={cn(
                        "rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition",
                        saveAs === value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {saveAs === "draft" ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary dark:text-foreground">
                      Changes Required
                    </p>
                    <Textarea
                      value={draftReason}
                      onChange={(e) => setDraftReason(e.target.value)}
                      placeholder="Explain what the instructor must change before resubmitting…"
                      rows={4}
                      required
                    />
                  </div>
                ) : null}

                <Button
                  type="button"
                  className="w-full"
                  variant="secondary"
                  onClick={openConfirm}
                  disabled={saveAs === "draft" && !draftReason.trim()}
                >
                  Continue
                </Button>
              </aside>
            </div>
          </>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to save as{" "}
              {saveAs === "published" ? "Published" : "Draft"}?
            </DialogTitle>
            <DialogDescription className="sr-only">
              Confirm course status change
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm dark:border-primary/20 dark:bg-primary/10">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              {saveAs === "published"
                ? "This course will become available to students once the process completes."
                : "The course will return to draft so the instructor can continue editing."}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl px-5"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-10 rounded-xl px-5"
              onClick={startProgressFlow}
            >
              Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={progressOpen}
        onOpenChange={(open) => {
          if (!open) cancelProgress();
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
                ? `Saved as ${saveAs === "published" ? "Published" : "Draft"}`
                : progressError
                  ? "Update failed"
                  : submitting
                    ? "Updating status…"
                    : "Preparing status change"}
            </DialogTitle>
            <DialogDescription>
              {progressDone
                ? "Course status has been updated."
                : progressError
                  ? progressError
                  : submitting
                    ? "Applying your decision…"
                    : `Saving as ${saveAs === "published" ? "Published" : "Draft"}…`}
            </DialogDescription>
          </DialogHeader>

          {!progressDone && !progressError ? (
            <div className="space-y-3 py-2">
              <Progress
                value={progress}
                className="h-2.5"
                indicatorClassName="bg-primary"
              />
              <p className="text-right text-xs font-semibold tabular-nums text-muted-foreground">
                {Math.round(progress)} %
              </p>
              {!submitting ? (
                <p className="text-center text-xs text-muted-foreground">
                  You can cancel until the status is changed.
                </p>
              ) : null}
            </div>
          ) : null}

          {progressDone || progressError ? (
            <DialogFooter>
              <Button
                type="button"
                className="h-10 rounded-xl px-5"
                onClick={() => {
                  setProgressOpen(false);
                  if (progressDone) router.push("/academic/courses");
                }}
              >
                {progressDone ? "Done" : "Close"}
              </Button>
            </DialogFooter>
          ) : !submitting ? (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-xl px-5"
                onClick={cancelProgress}
              >
                Cancel
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </AcademicShell>
  );
}
