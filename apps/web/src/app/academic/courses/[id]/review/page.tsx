"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Info,
  MessageSquare,
  UserRound,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AcademicShell } from "@/components/academic/AcademicShell";
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
import {
  academicCourseReviewRequest,
  academicSetCourseStatusRequest,
  courseCategoryLabel,
  getApiErrorMessage,
  mediaPublicUrl,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const COMPLETE_DURATION_MS = 60_000;

type LessonRow = {
  id?: string;
  title?: string;
  description?: string;
  videoUrl?: string;
  durationMinutes?: number;
};

type CurriculumModule = {
  id?: string;
  title: string;
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
  counts?: { modules?: number; lessons?: number };
  discussions?: DiscussionRow[];
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
};

function accessLabel(value?: string) {
  if (value === "6_months") return "6 months";
  if (value === "1_year") return "1 year";
  if (value === "lifetime") return "Lifetime";
  return value ?? "—";
}

export default function AcademicCourseReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = params.id;

  const [data, setData] = useState<CourseReviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [saveAs, setSaveAs] = useState<"draft" | "published">("published");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDone, setProgressDone] = useState(false);
  const [progressError, setProgressError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);
  const submitStartedRef = useRef(false);

  const progressLocked = progressOpen && submitting && !progressDone && !progressError;

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError("");
    try {
      const res = (await academicCourseReviewRequest(
        courseId,
      )) as CourseReviewPayload;
      setData(res);
      const first = res.curriculum?.[0];
      if (first?.id) setOpenModules({ [first.id]: true });
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
        await academicSetCourseStatusRequest(courseId, saveAs);
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

  const course = data?.course;
  const title = course?.title ?? "Course";
  const status = course?.status ?? "";
  const statusLabel = STATUS_LABEL[status] ?? status;
  const thumb = mediaPublicUrl(course?.bannerUrl ?? course?.thumbnailUrl);
  const price =
    (course?.priceCents ?? 0) === 0
      ? "Free"
      : `$${((course?.priceCents ?? 0) / 100).toFixed(0)}`;
  const outcomes = course?.learningOutcomes ?? [];
  const instructors = course?.instructors ?? [];
  const discussions = data?.discussions ?? [];
  const curriculum = data?.curriculum ?? [];

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
            {/* Hero course information — layered thumbnail */}
            <section className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-brand-navy text-white shadow-sm">
              <div className="absolute inset-0">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    className="object-cover opacity-35"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-brand-navy via-[#003d7a] to-brand-navy" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/95 via-brand-navy/80 to-brand-navy/40" />
              </div>

              <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.4fr_0.8fr] lg:p-10">
                <div className="space-y-4">
                  {course?.category ? (
                    <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur">
                      {courseCategoryLabel(course.category) || course.category}
                    </span>
                  ) : null}
                  <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
                    {title}
                  </h1>
                  <p className="max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                    {course?.description || "No description provided."}
                  </p>
                  {outcomes.length > 0 ? (
                    <div className="pt-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-lime">
                        What you&apos;ll learn
                      </p>
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {outcomes.slice(0, 6).map((o) => (
                          <li
                            key={o}
                            className="rounded-xl bg-white/10 px-3 py-2 text-sm backdrop-blur"
                          >
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/70">
                      Price
                    </p>
                    <p className="mt-1 text-3xl font-bold text-brand-lime">
                      {price}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-black/20 px-3 py-3">
                      <p className="text-xs text-white/60">Lessons</p>
                      <p className="mt-1 text-lg font-bold">
                        {data?.counts?.lessons ?? 0}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-black/20 px-3 py-3">
                      <p className="text-xs text-white/60">Access</p>
                      <p className="mt-1 text-lg font-bold">
                        {accessLabel(course?.accessDuration)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-white/80">
                    {course?.level ? (
                      <span className="rounded-full bg-white/10 px-2.5 py-1 capitalize">
                        {course.level}
                      </span>
                    ) : null}
                    {course?.language ? (
                      <span className="rounded-full bg-white/10 px-2.5 py-1 uppercase">
                        {course.language}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-white/10 px-2.5 py-1">
                      {data?.counts?.modules ?? 0} sections
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Split: tabs + curriculum / save */}
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="card-soft overflow-hidden">
                <Tabs defaultValue="instructor" className="w-full">
                  <div className="border-b border-border/70 px-4 pt-4">
                    <TabsList>
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
                            <p className="font-semibold text-brand-navy dark:text-foreground">
                              {ins.fullName ?? "Instructor"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {ins.email}
                            </p>
                          </div>
                        </div>
                      ))
                    )}

                    <div className="pt-2">
                      <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
                        Curriculum
                      </h2>
                      <div className="mt-3 space-y-2">
                        {curriculum.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No sections yet.
                          </p>
                        ) : (
                          curriculum.map((mod, idx) => {
                            const key = mod.id ?? String(idx);
                            const open = openModules[key] ?? false;
                            return (
                              <div
                                key={key}
                                className="overflow-hidden rounded-2xl border border-border/70"
                              >
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between gap-3 bg-muted/40 px-4 py-3 text-left"
                                  onClick={() =>
                                    setOpenModules((prev) => ({
                                      ...prev,
                                      [key]: !open,
                                    }))
                                  }
                                >
                                  <span className="font-semibold">
                                    {mod.title}
                                  </span>
                                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {mod.lessons?.length ?? 0} lessons
                                    {open ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </span>
                                </button>
                                {open ? (
                                  <ul className="divide-y divide-border/60">
                                    {(mod.lessons ?? []).map((lesson, li) => (
                                      <li
                                        key={lesson.id ?? `${key}-${li}`}
                                        className="px-4 py-3 text-sm"
                                      >
                                        <p className="font-medium">
                                          {lesson.title}
                                        </p>
                                        {lesson.description ? (
                                          <p className="mt-1 line-clamp-2 text-muted-foreground">
                                            {lesson.description.replace(
                                              /<[^>]+>/g,
                                              "",
                                            )}
                                          </p>
                                        ) : null}
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="discussions" className="space-y-4 p-5">
                    {discussions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No discussion messages yet.
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
                                {(d.authorName ?? "U").slice(0, 1).toUpperCase()}
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
                  </TabsContent>
                </Tabs>
              </div>

              <aside className="card-soft h-fit space-y-5 p-5">
                <div>
                  <h2 className="text-base font-bold text-brand-navy dark:text-foreground">
                    Save as
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Academic can set this course to Draft or Published.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["draft", "Draft"],
                      ["published", "Publish"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSaveAs(value)}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                        saveAs === value
                          ? "border-brand-navy bg-brand-navy text-white dark:border-brand-lime dark:bg-brand-lime dark:text-brand-navy"
                          : "border-border bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  variant="secondary"
                  onClick={openConfirm}
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
          <div className="flex gap-3 rounded-2xl border border-brand-navy/15 bg-brand-navy/5 px-4 py-3 text-sm dark:border-brand-lime/20 dark:bg-brand-lime/10">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-navy dark:text-brand-lime" />
            <p>
              {saveAs === "published"
                ? "This course will become available to students once the process completes."
                : "The course will return to draft so the instructor can continue editing."}
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" variant="secondary" onClick={startProgressFlow}>
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
              <Progress value={progress} className="h-2.5" />
              <p className="text-center text-sm font-semibold tabular-nums text-brand-navy dark:text-brand-lime">
                {Math.round(progress)}%
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
              <Button type="button" variant="ghost" onClick={cancelProgress}>
                Cancel
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </AcademicShell>
  );
}
