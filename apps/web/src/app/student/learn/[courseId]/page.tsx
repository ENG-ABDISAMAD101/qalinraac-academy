"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Layers,
  Menu,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotificationsMenu } from "@/components/student/NotificationsMenu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  attemptQuizRequest,
  completeLessonRequest,
  getApiErrorMessage,
  getQuizRequest,
  studentLearnRequest,
  submitAssignmentRequest,
  uploadFileRequest,
  type StudentLearnData,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn, initialsFromName } from "@/lib/utils";

type Tab = "content" | "quiz" | "assignment";

function formatDuration(mins?: number) {
  if (!mins || mins <= 0) return "—";
  const m = Math.floor(mins);
  const s = Math.round((mins - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function LearningPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [data, setData] = useState<StudentLearnData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("content");
  const [busy, setBusy] = useState(false);

  const [quizStarted, setQuizStarted] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState<{
    id: string;
    title: string;
    passingScore: number;
    questions: { prompt: string; options: string[]; points: number }[];
  } | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<{
    percent: number;
    passed: boolean;
  } | null>(null);

  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitMsg, setSubmitMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const learn = await studentLearnRequest(courseId);
      setData(learn);
      setOpenModules(
        Object.fromEntries(learn.modules.map((m) => [m.id, true])),
      );
      const firstIncomplete =
        learn.modules
          .flatMap((m) => m.lessons)
          .find((l) => !l.completed)?.id ??
        learn.modules[0]?.lessons[0]?.id ??
        null;
      setLessonId((prev) => prev ?? firstIncomplete);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load this course."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!authLoading && user?.role === "Student") void load();
  }, [authLoading, user, load]);

  const flatLessons = useMemo(
    () => data?.modules.flatMap((m) => m.lessons) ?? [],
    [data],
  );

  const currentLesson = flatLessons.find((l) => l.id === lessonId) ?? flatLessons[0];

  const lessonQuizzes =
    data?.quizzes.filter(
      (q) => !q.lessonId || q.lessonId === currentLesson?.id,
    ) ?? [];
  const lessonAssignments =
    data?.assignments.filter(
      (a) => !a.lessonId || a.lessonId === currentLesson?.id,
    ) ?? [];

  const activeQuizMeta = lessonQuizzes[0] ?? data?.quizzes[0];
  const activeAssignment = lessonAssignments[0] ?? data?.assignments[0];

  async function markComplete() {
    if (!currentLesson || !data) return;
    setBusy(true);
    try {
      await completeLessonRequest(data.course.id, currentLesson.id);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not mark lesson complete."));
    } finally {
      setBusy(false);
    }
  }

  async function startQuiz() {
    if (!activeQuizMeta) return;
    setQuizLoading(true);
    setQuizResult(null);
    try {
      const raw = await getQuizRequest(activeQuizMeta.id);
      const id = String(raw.id ?? raw._id ?? activeQuizMeta.id);
      setQuiz({
        id,
        title: raw.title,
        passingScore: raw.passingScore,
        questions: raw.questions,
      });
      setAnswers(Array(raw.questions.length).fill(-1));
      setQIndex(0);
      setQuizStarted(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not start quiz."));
    } finally {
      setQuizLoading(false);
    }
  }

  async function submitQuizAnswers() {
    if (!quiz) return;
    if (answers.some((a) => a < 0)) {
      setError("Please answer every question before submitting.");
      return;
    }
    setBusy(true);
    try {
      const result = await attemptQuizRequest(quiz.id, answers);
      setQuizResult({ percent: result.percent, passed: result.passed });
      setQuizStarted(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit quiz."));
    } finally {
      setBusy(false);
    }
  }

  async function submitAssignment() {
    if (!activeAssignment) return;
    setBusy(true);
    setSubmitMsg("");
    try {
      let fileAssetId: string | undefined;
      if (file) {
        const uploaded = await uploadFileRequest(file);
        fileAssetId = uploaded.id;
      }
      await submitAssignmentRequest(activeAssignment.id, {
        content: notes.trim() || undefined,
        fileAssetId,
      });
      setSubmitMsg("Assignment submitted successfully.");
      setNotes("");
      setFile(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not submit assignment."));
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || loading) {
    return <PageLoader label="Loading lesson" />;
  }

  if (!user || user.role !== "Student") {
    router.replace("/auth/login");
    return null;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-destructive">{error || "Course unavailable."}</p>
        <Button asChild>
          <Link href="/student/courses">Back to My Courses</Link>
        </Button>
      </div>
    );
  }

  const progress = data.enrollment.progressPercent ?? 0;
  const dayLabel = `Day ${data.completedCount}/${data.lessonCount || 1}`;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Top utility bar — image 1 */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-white/95 backdrop-blur dark:bg-background/95">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-xl p-2 text-brand-navy hover:bg-muted"
            aria-label="Toggle curriculum"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy dark:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              {dayLabel}
            </span>
            <NotificationsMenu />
            <ThemeToggle />
            <Button
              type="button"
              disabled={busy || currentLesson?.completed}
              onClick={() => void markComplete()}
              className={cn(
                "rounded-full",
                currentLesson?.completed
                  ? "bg-muted text-muted-foreground"
                  : "bg-brand-navy text-white hover:bg-brand-navy/90",
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              {currentLesson?.completed ? "Completed" : "Complete Lesson"}
            </Button>
          </div>
        </div>

        {/* Course title row — image 2 */}
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-3 border-t border-border/50 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold text-brand-navy dark:text-foreground md:text-2xl">
              {data.course.title}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              <span>{data.lessonCount} Lessons</span>
              <span>·</span>
              <span>{progress}% Complete</span>
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        {sidebarOpen ? (
          <aside className="scrollbar-thin sticky top-[8.5rem] hidden h-[calc(100vh-8.5rem)] w-[320px] shrink-0 overflow-y-auto border-r border-border bg-white dark:bg-background lg:block">
            <div className="p-4">
              {data.modules.map((mod) => {
                const open = openModules[mod.id] !== false;
                const allDone = mod.lessons.every((l) => l.completed);
                return (
                  <div key={mod.id} className="mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenModules((prev) => ({
                          ...prev,
                          [mod.id]: !open,
                        }))
                      }
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-2.5 text-left"
                    >
                      {open ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">
                        {mod.title}
                      </span>
                      {allDone ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-lime" />
                      ) : null}
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {mod.lessons.length} lessons
                      </span>
                    </button>
                    {open ? (
                      <>
                        <div className="mx-2 mb-1 h-0.5 bg-brand-navy dark:bg-brand-lime" />
                        <ul>
                          {mod.lessons.map((lesson) => {
                            const active = lesson.id === currentLesson?.id;
                            return (
                              <li key={lesson.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLessonId(lesson.id);
                                    setTab("content");
                                    setQuizStarted(false);
                                  }}
                                  className={cn(
                                    "flex w-full items-center gap-3 border-b border-border/60 px-3 py-3 text-left text-sm transition",
                                    active
                                      ? "bg-brand-navy/5 text-brand-navy dark:bg-brand-lime/10"
                                      : "text-muted-foreground hover:bg-muted/50",
                                  )}
                                >
                                  {lesson.completed ? (
                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-lime" />
                                  ) : (
                                    <Circle className="h-4 w-4 shrink-0" />
                                  )}
                                  <span className="min-w-0 flex-1 truncate font-medium">
                                    {lesson.title}
                                  </span>
                                  <span className="shrink-0 text-xs">
                                    {formatDuration(lesson.durationMinutes)}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </aside>
        ) : null}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {error ? (
            <p className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-[1.25rem] bg-brand-navy shadow-lg">
            {currentLesson?.videoUrl ? (
              <video
                key={currentLesson.id}
                controls
                className="aspect-video w-full bg-black"
                src={currentLesson.videoUrl}
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-brand-navy to-[#001a38] text-white">
                <div className="px-6 text-center">
                  <p className="text-sm text-white/70">Lesson video</p>
                  <p className="mt-2 text-xl font-bold">
                    {currentLesson?.title ?? "Select a lesson"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as Tab)}
              className="w-full"
            >
              <TabsList className="w-full justify-start sm:w-auto">
                <TabsTrigger value="content">Lesson content</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
                <TabsTrigger value="assignment">Assignment</TabsTrigger>
              </TabsList>

              <TabsContent value="content">
                <article className="card-soft p-6">
                  <h2 className="text-lg font-bold text-brand-navy dark:text-foreground">
                    {currentLesson?.title}
                  </h2>
                  {data.instructors[0] ? (
                    <div className="mt-3 flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={data.instructors[0].avatarUrl} />
                        <AvatarFallback>
                          {initialsFromName(data.instructors[0].fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">
                          {data.instructors[0].fullName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Instructor
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <div className="prose prose-sm mt-5 max-w-none text-muted-foreground dark:prose-invert">
                    {currentLesson?.content ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: currentLesson.content,
                        }}
                      />
                    ) : (
                      <p>
                        Lesson materials from your instructor will appear here.
                      </p>
                    )}
                  </div>
                </article>
              </TabsContent>

              <TabsContent value="quiz">
                {!activeQuizMeta ? (
                  <div className="card-soft p-6 text-sm text-muted-foreground">
                    No quiz is linked to this lesson yet.
                  </div>
                ) : quizStarted && quiz ? (
                  <div className="mx-auto max-w-lg rounded-[1.75rem] border border-border bg-white p-6 shadow-lg dark:bg-card">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        className="text-sm font-semibold text-muted-foreground"
                        onClick={() => setQuizStarted(false)}
                      >
                        ← Back
                      </button>
                      <p className="text-sm font-bold text-brand-navy dark:text-foreground">
                        {quiz.title}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {qIndex + 1}/{quiz.questions.length}
                      </span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-brand-navy"
                        style={{
                          width: `${((qIndex + 1) / quiz.questions.length) * 100}%`,
                        }}
                      />
                    </div>
                    <p className="mt-5 text-xs font-semibold text-brand-navy">
                      Question {qIndex + 1} of {quiz.questions.length}
                    </p>
                    <h3 className="mt-2 text-lg font-bold leading-snug text-foreground">
                      {quiz.questions[qIndex]?.prompt}
                    </h3>
                    <ul className="mt-5 space-y-3">
                      {quiz.questions[qIndex]?.options.map((opt, oi) => {
                        const selected = answers[qIndex] === oi;
                        return (
                          <li key={oi}>
                            <button
                              type="button"
                              onClick={() =>
                                setAnswers((prev) => {
                                  const next = [...prev];
                                  next[qIndex] = oi;
                                  return next;
                                })
                              }
                              className={cn(
                                "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition",
                                selected
                                  ? "border-brand-navy bg-brand-navy/5 text-brand-navy"
                                  : "border-border bg-background hover:bg-muted/40",
                              )}
                            >
                              <span>{opt}</span>
                              <span
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded-full border",
                                  selected
                                    ? "border-brand-navy bg-brand-navy text-white"
                                    : "border-muted-foreground/40",
                                )}
                              >
                                {selected ? (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                ) : null}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    <Button
                      type="button"
                      disabled={busy}
                      className="mt-6 h-12 w-full rounded-2xl bg-brand-navy"
                      onClick={() => {
                        if (qIndex < quiz.questions.length - 1) {
                          setQIndex((i) => i + 1);
                        } else {
                          void submitQuizAnswers();
                        }
                      }}
                    >
                      {busy ? (
                        <Spinner className="sm on-primary" label="Submitting" />
                      ) : null}
                      {qIndex < quiz.questions.length - 1
                        ? "Next →"
                        : "Submit quiz"}
                    </Button>
                  </div>
                ) : (
                  <div className="card-soft space-y-4 p-6">
                    <h2 className="text-lg font-bold text-brand-navy dark:text-foreground">
                      {activeQuizMeta.title}
                    </h2>
                    {activeQuizMeta.description ? (
                      <p className="text-sm text-muted-foreground">
                        {activeQuizMeta.description}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      {activeQuizMeta.questionCount} questions · Passing score{" "}
                      {activeQuizMeta.passingScore}%
                    </p>
                    {quizResult ? (
                      <p
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm font-semibold",
                          quizResult.passed
                            ? "bg-brand-lime-soft text-brand-navy"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        Score {quizResult.percent}% —{" "}
                        {quizResult.passed ? "Passed" : "Needs revision"}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      disabled={quizLoading}
                      onClick={() => void startQuiz()}
                    >
                      {quizLoading ? (
                        <Spinner className="sm on-primary" label="Loading" />
                      ) : null}
                      Start Quiz
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="assignment">
                {!activeAssignment ? (
                  <div className="card-soft p-6 text-sm text-muted-foreground">
                    No assignment is linked to this lesson yet.
                  </div>
                ) : (
                  <div className="card-soft space-y-5 p-6">
                    <div>
                      <h2 className="text-lg font-bold text-brand-navy dark:text-foreground">
                        {activeAssignment.title}
                      </h2>
                      {activeAssignment.description ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {activeAssignment.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional notes (optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add context or notes for your instructor…"
                      />
                    </div>
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-dashed border-border bg-muted/30 px-6 py-10 text-center transition hover:bg-muted/50">
                      <Upload className="h-6 w-6 text-brand-navy" />
                      <span className="text-sm font-semibold text-brand-navy dark:text-foreground">
                        Upload assignment file
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PDF, DOCX, images, or ZIP
                      </span>
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) =>
                          setFile(e.target.files?.[0] ?? null)
                        }
                      />
                      {file ? (
                        <span className="mt-2 text-xs font-medium text-foreground">
                          {file.name}
                        </span>
                      ) : null}
                    </label>
                    {submitMsg ? (
                      <p className="text-sm font-medium text-brand-navy">
                        {submitMsg}
                      </p>
                    ) : null}
                    <Button
                      type="button"
                      disabled={busy || (!notes.trim() && !file)}
                      onClick={() => void submitAssignment()}
                    >
                      {busy ? (
                        <Spinner className="sm on-primary" label="Submitting" />
                      ) : null}
                      Submit assignment
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
