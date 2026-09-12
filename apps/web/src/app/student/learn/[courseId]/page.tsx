"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Layers,
  Menu,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ProtectedVideoPlayer } from "@/components/student/ProtectedVideoPlayer";
import { NotificationsMenu } from "@/components/student/NotificationsMenu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageLoader, Spinner } from "@/components/ui/spinner";
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
import { useRequireAuth } from "@/lib/auth-context";
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
  const { user, ready: authReady } = useRequireAuth("Student");

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
    if (!authReady || !user) return;
    void load();
  }, [authReady, user, load]);

  const flatLessons = useMemo(
    () => data?.modules.flatMap((m) => m.lessons) ?? [],
    [data],
  );

  const currentIndex = flatLessons.findIndex((l) => l.id === lessonId);
  const currentLesson =
    (currentIndex >= 0 ? flatLessons[currentIndex] : flatLessons[0]) ?? null;
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : null;

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

  function selectLesson(id: string) {
    setLessonId(id);
    setTab("content");
    setQuizStarted(false);
    setQuizResult(null);
    const parent = data?.modules.find((m) =>
      m.lessons.some((l) => l.id === id),
    );
    if (parent) {
      setOpenModules((prev) => ({ ...prev, [parent.id]: true }));
    }
  }

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

  if (!authReady || !user) {
    return <PageLoader label="Loading lesson" />;
  }

  if (loading) {
    return <PageLoader label="Loading lesson" />;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 bg-canvas">
        <p className="text-sm text-destructive">{error || "Course unavailable."}</p>
        <Button asChild>
          <Link href="/student/courses">Back to My Courses</Link>
        </Button>
      </div>
    );
  }

  const progress = data.enrollment.progressPercent ?? 0;
  const dayLabel = `Day ${data.completedCount}/${data.lessonCount || 1}`;
  const lessonNumber = Math.max(currentIndex + 1, 1);

  const hasQuiz = Boolean(activeQuizMeta);
  const hasAssignment = Boolean(activeAssignment);
  const activeTab: Tab =
    tab === "quiz" && !hasQuiz
      ? "content"
      : tab === "assignment" && !hasAssignment
        ? "content"
        : tab;

  const tabCards: {
    id: Tab;
    label: string;
    hint: string;
    icon: typeof Layers;
  }[] = [
    {
      id: "content",
      label: "Lesson Content",
      hint: "Read lesson materials.",
      icon: Layers,
    },
    ...(hasQuiz
      ? [
          {
            id: "quiz" as const,
            label: "Quiz",
            hint: "Check your understanding.",
            icon: BookOpen,
          },
        ]
      : []),
    ...(hasAssignment
      ? [
          {
            id: "assignment" as const,
            label: "Assignment",
            hint: "Submit your work.",
            icon: Upload,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-xl p-2 text-foreground hover:bg-muted"
            aria-label="Toggle curriculum"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-semibold text-foreground">
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
                  ? "border border-border bg-muted text-muted-foreground hover:bg-muted"
                  : undefined,
              )}
              variant={currentLesson?.completed ? "secondary" : "default"}
            >
              <CheckCircle2 className="h-4 w-4" />
              {currentLesson?.completed ? "Completed" : "Complete"}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {sidebarOpen ? (
          <aside className="scrollbar-thin sticky top-[3.5rem] hidden h-[calc(100vh-3.5rem)] w-[300px] shrink-0 overflow-y-auto border-r border-border bg-background lg:block xl:w-[320px]">
            <div className="space-y-4 p-5">
              <div>
                <h1 className="font-display text-lg font-bold leading-snug text-foreground">
                  {data.course.title}
                </h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Layers className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {data.lessonCount} Lessons{" "}
                    <span className="text-foreground/40">|</span> {progress}%
                    Complete
                  </span>
                </p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{
                      width: `${Math.min(Math.max(progress, 0), 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {data.completedCount} of {data.lessonCount || 1} lessons
                  completed
                </p>
              </div>

              <div className="space-y-3">
                {data.modules.map((mod, modIndex) => {
                  const open = openModules[mod.id] !== false;
                  return (
                    <div
                      key={mod.id}
                      className="overflow-hidden rounded-2xl border border-border bg-muted/40 dark:bg-[#1A1A1A]"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenModules((prev) => ({
                            ...prev,
                            [mod.id]: !open,
                          }))
                        }
                        className="flex w-full items-center gap-2 px-3 py-3 text-left"
                        aria-expanded={open}
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                            !open && "-rotate-90",
                          )}
                        />
                        <span className="min-w-0 flex-1 text-center text-sm font-bold leading-snug text-foreground">
                          Module {modIndex + 1} · {mod.title}
                        </span>
                        <span className="flex min-h-10 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-border bg-background px-1 py-1 text-center text-[10px] font-semibold leading-tight text-muted-foreground">
                          <span>{mod.lessons.length}</span>
                          <span>lessons</span>
                        </span>
                      </button>

                      <div
                        className={cn(
                          "grid transition-[grid-template-rows] duration-200",
                          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                      >
                        <div className="overflow-hidden">
                          <div className="border-t border-border/80 px-1.5 pb-1.5 pt-1">
                            <ul>
                              {mod.lessons.map((lesson) => {
                                const active = lesson.id === currentLesson?.id;
                                return (
                                  <li key={lesson.id}>
                                    <button
                                      type="button"
                                      onClick={() => selectLesson(lesson.id)}
                                      className={cn(
                                        "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                                        active
                                          ? "bg-background text-foreground shadow-sm dark:bg-[#121212]"
                                          : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
                                      )}
                                    >
                                      {active ? (
                                        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-foreground" />
                                      ) : null}
                                      {lesson.completed ? (
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-foreground" />
                                      ) : (
                                        <Circle
                                          className={cn(
                                            "h-4 w-4 shrink-0",
                                            active
                                              ? "text-foreground"
                                              : "opacity-50",
                                          )}
                                        />
                                      )}
                                      <span className="min-w-0 flex-1 truncate font-medium">
                                        {lesson.title}
                                      </span>
                                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                        {formatDuration(lesson.durationMinutes)}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        ) : null}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {error ? (
            <p className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <ProtectedVideoPlayer
            key={currentLesson?.id}
            src={currentLesson?.videoUrl}
            title={currentLesson?.title}
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={!prevLesson}
              className="h-11 rounded-full px-5"
              onClick={() => prevLesson && selectLesson(prevLesson.id)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Lesson
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!nextLesson}
              className="h-11 rounded-full px-5"
              onClick={() => nextLesson && selectLesson(nextLesson.id)}
            >
              Next Lesson
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {currentLesson?.title ?? "Lesson"}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Lesson {lessonNumber} of {flatLessons.length || 1}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(currentLesson?.durationMinutes)}
              </span>
            </div>
          </div>

          <div
            className={cn(
              "mt-6 grid gap-3",
              tabCards.length === 1
                ? "grid-cols-1"
                : tabCards.length === 2
                  ? "sm:grid-cols-2"
                  : "sm:grid-cols-3",
            )}
          >
            {tabCards.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "rounded-2xl border px-4 py-4 text-left transition",
                    active
                      ? "border-foreground/20 bg-muted text-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs">{item.hint}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {activeTab === "content" ? (
              <article className="rounded-2xl border border-border bg-card p-6">
                {data.instructors[0] ? (
                  <div className="mb-5 flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarImage src={data.instructors[0].avatarUrl} />
                      <AvatarFallback>
                        {initialsFromName(data.instructors[0].fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">
                        {data.instructors[0].fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">Instructor</p>
                    </div>
                  </div>
                ) : null}
                <div className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
                  {currentLesson?.content ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: currentLesson.content,
                      }}
                    />
                  ) : (
                    <p>Lesson materials from your instructor will appear here.</p>
                  )}
                </div>
              </article>
            ) : null}

            {activeTab === "quiz" ? (
              !activeQuizMeta ? (
                <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                  No quiz is linked to this lesson yet.
                </div>
              ) : quizStarted && quiz ? (
                <div className="mx-auto max-w-lg rounded-[1.75rem] border border-border bg-card p-6">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="text-sm font-semibold text-muted-foreground"
                      onClick={() => setQuizStarted(false)}
                    >
                      ← Back
                    </button>
                    <p className="text-sm font-bold">{quiz.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {qIndex + 1}/{quiz.questions.length}
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{
                        width: `${((qIndex + 1) / quiz.questions.length) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="mt-5 text-xs font-semibold">
                    Question {qIndex + 1} of {quiz.questions.length}
                  </p>
                  <h3 className="mt-2 text-lg font-bold leading-snug">
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
                                ? "border-foreground bg-muted"
                                : "border-border hover:bg-muted/40",
                            )}
                          >
                            <span>{opt}</span>
                            <span
                              className={cn(
                                "flex h-5 w-5 items-center justify-center rounded-full border",
                                selected
                                  ? "border-foreground bg-foreground text-background"
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
                    className="mt-6 h-12 w-full rounded-2xl"
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
                <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-lg font-bold">{activeQuizMeta.title}</h3>
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
                          ? "bg-muted text-foreground"
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
              )
            ) : null}

            {activeTab === "assignment" ? (
              !activeAssignment ? (
                <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                  No assignment is linked to this lesson yet.
                </div>
              ) : (
                <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
                  <div>
                    <h3 className="text-lg font-bold">{activeAssignment.title}</h3>
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
                    <Upload className="h-6 w-6" />
                    <span className="text-sm font-semibold">
                      Upload assignment file
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF, DOCX, images, or ZIP
                    </span>
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    {file ? (
                      <span className="mt-2 text-xs font-medium">{file.name}</span>
                    ) : null}
                  </label>
                  {submitMsg ? (
                    <p className="text-sm font-medium text-foreground">
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
              )
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
