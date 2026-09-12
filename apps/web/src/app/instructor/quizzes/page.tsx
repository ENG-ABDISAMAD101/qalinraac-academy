"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Info, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { InstructorShell } from "@/components/instructor/InstructorShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogFormActions,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField, formSelectClassName } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorMessage,
  instructorCourseLessonsRequest,
  instructorCoursesRequest,
  instructorCreateQuizRequest,
  instructorDeleteQuizRequest,
  instructorQuizzesRequest,
  instructorUpdateQuizRequest,
  type InstructorCourse,
} from "@/lib/api";

const ACTION_DURATION_MS = 30_000;

type ProgressKind = "save" | "delete";

type QuizItem = Awaited<
  ReturnType<typeof instructorQuizzesRequest>
>["items"][number];

type LessonOption = { id: string; title: string; moduleId: string };

type QuestionDraft = {
  prompt: string;
  options: string[];
  correctIndex: number;
  points: number;
};

const emptyQuestion = (): QuestionDraft => ({
  prompt: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  points: 1,
});

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

function questionsFromQuiz(item: QuizItem): QuestionDraft[] {
  const rows = Array.isArray(item.questions) ? item.questions : [];
  if (rows.length === 0) return [emptyQuestion()];
  return rows.map((q) => {
    const options = [...(q.options ?? [])];
    while (options.length < 4) options.push("");
    return {
      prompt: q.prompt ?? "",
      options: options.slice(0, Math.max(4, options.length)),
      correctIndex: q.correctIndex ?? 0,
      points: q.points ?? 1,
    };
  });
}

export default function InstructorQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [q, setQ] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuizItem | null>(null);
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [passingScore, setPassingScore] = useState("70");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [formError, setFormError] = useState("");
  const [loadingLessons, setLoadingLessons] = useState(false);
  const preserveLessonRef = useRef(false);

  const [deleteTarget, setDeleteTarget] = useState<QuizItem | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ProgressKind>("save");
  const [progressMode, setProgressMode] = useState<"create" | "update" | "delete">(
    "create",
  );
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressError, setProgressError] = useState("");
  const [progressDone, setProgressDone] = useState(false);
  const [actionRunning, setActionRunning] = useState(false);
  const cancelledRef = useRef(false);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const submitStartedRef = useRef(false);
  const progressLocked =
    progressOpen && actionRunning && !progressDone && !progressError;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await instructorQuizzesRequest();
      setQuizzes(data.items);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load quizzes."));
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!formOpen) return;
    void (async () => {
      try {
        const data = await instructorCoursesRequest();
        setCourses(data.items);
      } catch {
        setCourses([]);
      }
    })();
  }, [formOpen]);

  useEffect(() => {
    if (!courseId) {
      setLessons([]);
      if (!preserveLessonRef.current) setLessonId("");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingLessons(true);
      try {
        const data = await instructorCourseLessonsRequest(courseId);
        if (!cancelled) {
          setLessons(data.items);
          if (!preserveLessonRef.current) setLessonId("");
          preserveLessonRef.current = false;
        }
      } catch {
        if (!cancelled) setLessons([]);
      } finally {
        if (!cancelled) setLoadingLessons(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const filteredQuizzes = useMemo(() => {
    if (!q.trim()) return quizzes;
    const needle = q.trim().toLowerCase();
    return quizzes.filter(
      (quiz) =>
        quiz.title.toLowerCase().includes(needle) ||
        quiz.courseTitle.toLowerCase().includes(needle),
    );
  }, [quizzes, q]);

  function resetForm() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setCourseId("");
    setLessonId("");
    setPassingScore("70");
    setQuestions([emptyQuestion()]);
    setFormError("");
    preserveLessonRef.current = false;
  }

  function openCreate() {
    resetForm();
    setFormOpen(true);
  }

  function openEdit(item: QuizItem) {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description ?? "");
    preserveLessonRef.current = true;
    setCourseId(item.courseId);
    setLessonId(item.lessonId ?? "");
    setPassingScore(String(item.passingScore ?? 70));
    setQuestions(questionsFromQuiz(item));
    setFormError("");
    setFormOpen(true);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function resetProgressState() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startedAtRef.current = null;
    submitStartedRef.current = false;
    setProgress(0);
    setProgressError("");
    setProgressDone(false);
    setActionRunning(false);
  }

  function cancelProgressFlow() {
    if (progressLocked) return;
    cancelledRef.current = true;
    resetProgressState();
    setProgressOpen(false);
  }

  function cleanedQuestions() {
    return questions
      .map((qq) => ({
        prompt: qq.prompt.trim(),
        options: qq.options.map((o) => o.trim()).filter(Boolean),
        correctIndex: qq.correctIndex,
        points: qq.points || 1,
      }))
      .filter((qq) => qq.prompt && qq.options.length >= 2);
  }

  function validateForm(): string | null {
    if (!title.trim() || !courseId) {
      return "Title and course are required.";
    }
    const pass = Number(passingScore);
    if (Number.isNaN(pass) || pass < 0 || pass > 100) {
      return "Passing score must be between 0 and 100.";
    }
    const cleaned = cleanedQuestions();
    if (cleaned.length === 0) {
      return "Add at least one question with two options.";
    }
    for (const qq of cleaned) {
      if (qq.correctIndex < 0 || qq.correctIndex >= qq.options.length) {
        return "Each question needs a valid correct option.";
      }
    }
    return null;
  }

  async function executeSave() {
    const cleaned = cleanedQuestions();
    const pass = Number(passingScore) || 70;
    if (editing) {
      await instructorUpdateQuizRequest(editing.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        lessonId: lessonId || null,
        passingScore: pass,
        questions: cleaned,
      });
      return "Quiz updated successfully.";
    }
    await instructorCreateQuizRequest({
      title: title.trim(),
      description: description.trim() || undefined,
      courseId,
      lessonId: lessonId || undefined,
      passingScore: pass,
      questions: cleaned,
    });
    return "Quiz created successfully.";
  }

  async function executeDelete() {
    if (!deleteTarget) throw new Error("No quiz selected.");
    await instructorDeleteQuizRequest(deleteTarget.id);
    return "Quiz deleted successfully.";
  }

  function startProgressFlow(kind: ProgressKind) {
    cancelledRef.current = false;
    submitStartedRef.current = false;
    setConfirmKind(kind);
    setProgressMode(
      kind === "delete" ? "delete" : editing ? "update" : "create",
    );
    setConfirmOpen(false);
    setProgressOpen(true);
    setProgress(0);
    setProgressError("");
    setProgressDone(false);
    setActionRunning(false);
    startedAtRef.current = performance.now();

    const finishAndRun = async () => {
      if (cancelledRef.current || submitStartedRef.current) return;
      submitStartedRef.current = true;
      setProgress(100);
      setActionRunning(true);
      try {
        const message =
          kind === "delete" ? await executeDelete() : await executeSave();
        if (cancelledRef.current) {
          resetProgressState();
          setProgressOpen(false);
          return;
        }
        setFlash(message);
        setProgressDone(true);
        if (kind === "save") {
          setFormOpen(false);
          resetForm();
        } else {
          setDeleteTarget(null);
        }
        await load();
      } catch (err) {
        if (cancelledRef.current) {
          resetProgressState();
          setProgressOpen(false);
          return;
        }
        setProgressError(
          getApiErrorMessage(
            err,
            kind === "delete"
              ? "Could not delete the quiz."
              : editing
                ? "Could not save quiz changes."
                : "Could not create the quiz.",
          ),
        );
      } finally {
        setActionRunning(false);
      }
    };

    const tick = (now: number) => {
      if (cancelledRef.current) return;
      const started = startedAtRef.current ?? now;
      const elapsed = now - started;
      const next = Math.min(100, (elapsed / ACTION_DURATION_MS) * 100);
      setProgress(next);
      if (elapsed >= ACTION_DURATION_MS) {
        void finishAndRun();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }

  function onSave(e: FormEvent) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError("");
    setConfirmKind("save");
    setConfirmOpen(true);
  }

  function requestDelete(item: QuizItem) {
    setDeleteTarget(item);
    setConfirmKind("delete");
    setConfirmOpen(true);
  }

  return (
    <InstructorShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Quizzes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage quizzes. Review attempts in Submissions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/instructor/submissions">View submissions</Link>
            </Button>
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create Quiz
            </Button>
          </div>
        </div>

        {flash ? (
          <p className="rounded-2xl bg-muted px-4 py-3 text-sm font-medium text-foreground dark:bg-[#1A1A1A]">
            {flash}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:max-w-xs">
          <div className="card-soft px-4 py-4">
            <p className="text-xs font-medium text-muted-foreground">
              Total quizzes
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {quizzes.length}
            </p>
          </div>
        </div>

        <label className="relative block min-w-[16rem] max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search quiz or course"
            className="pl-11"
          />
        </label>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading quizzes" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : filteredQuizzes.length === 0 ? (
          <div className="card-soft px-5 py-10 text-center text-sm text-muted-foreground">
            {quizzes.length === 0
              ? "No quizzes yet. Create one to get started."
              : "No quizzes match your search."}
          </div>
        ) : (
          <section className="space-y-3">
            {filteredQuizzes.map((quiz) => (
              <article
                key={quiz.id}
                className="card-soft flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{quiz.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {quiz.courseTitle}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {quiz.questionCount} question
                    {quiz.questionCount === 1 ? "" : "s"}
                    {` · Pass ${quiz.passingScore}%`}
                    {quiz.createdAt ? ` · ${formatDateTime(quiz.createdAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(quiz)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => requestDelete(quiz)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl gap-5 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit quiz" : "Create quiz"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update details, passing score, or questions. Course stays the same."
                : "Attach the quiz to a course and add multiple-choice questions."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSave} className="space-y-5">
            <FormField label="Title" htmlFor="q-title">
              <Input
                id="q-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Description" htmlFor="q-desc">
              <Textarea
                id="q-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Course" htmlFor="q-course">
                <select
                  id="q-course"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className={formSelectClassName}
                  required
                  disabled={Boolean(editing)}
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Lesson (optional)" htmlFor="q-lesson">
                <select
                  id="q-lesson"
                  value={lessonId}
                  onChange={(e) => setLessonId(e.target.value)}
                  className={formSelectClassName}
                  disabled={!courseId || loadingLessons}
                >
                  <option value="">
                    {loadingLessons ? "Loading lessons…" : "None"}
                  </option>
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label="Passing score (%)" htmlFor="q-pass">
              <Input
                id="q-pass"
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                required
              />
            </FormField>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Questions
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setQuestions((prev) => [...prev, emptyQuestion()])
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add question
                </Button>
              </div>
              {questions.map((qq, qi) => (
                <div
                  key={qi}
                  className="space-y-3 rounded-2xl border border-border p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground">
                      Question {qi + 1}
                    </p>
                    {questions.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setQuestions((prev) =>
                            prev.filter((_, i) => i !== qi),
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                  <Input
                    value={qq.prompt}
                    onChange={(e) =>
                      setQuestions((prev) =>
                        prev.map((row, i) =>
                          i === qi ? { ...row, prompt: e.target.value } : row,
                        ),
                      )
                    }
                    placeholder="Question prompt"
                    required
                  />
                  <div className="space-y-2">
                    {qq.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={qq.correctIndex === oi}
                          onChange={() =>
                            setQuestions((prev) =>
                              prev.map((row, i) =>
                                i === qi
                                  ? { ...row, correctIndex: oi }
                                  : row,
                              ),
                            )
                          }
                          className="h-4 w-4 accent-primary"
                        />
                        <Input
                          value={opt}
                          onChange={(e) =>
                            setQuestions((prev) =>
                              prev.map((row, i) =>
                                i === qi
                                  ? {
                                      ...row,
                                      options: row.options.map((o, j) =>
                                        j === oi ? e.target.value : o,
                                      ),
                                    }
                                  : row,
                              ),
                            )
                          }
                          placeholder={`Option ${oi + 1}`}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            <DialogFormActions
              helpHref="/instructor/support"
              cancelLabel="Cancel"
              confirmLabel={editing ? "Save changes" : "Create"}
              confirmLoading={false}
              onCancel={() => {
                setFormOpen(false);
                resetForm();
              }}
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmOpen(false);
            if (confirmKind === "delete") setDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmKind === "delete"
                ? "Delete this quiz?"
                : editing
                  ? "Save quiz changes?"
                  : "Create this quiz?"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Confirm before continuing.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground dark:bg-[#1A1A1A]">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p>
              {confirmKind === "delete" ? (
                <>
                  You are about to permanently delete{" "}
                  <span className="font-semibold">
                    “{deleteTarget?.title}”
                  </span>
                  . Student attempts linked to this quiz will also be removed.
                  This action cannot be undone after the process finishes.
                </>
              ) : editing ? (
                <>
                  Please review your updates before continuing. Saving will
                  apply these changes for students taking this quiz. You can
                  still cancel during the preparation step.
                </>
              ) : (
                <>
                  This will publish the quiz to the selected course. Students
                  enrolled in the course will be able to attempt it. You can
                  cancel during the preparation step.
                </>
              )}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                if (confirmKind === "delete") setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={confirmKind === "delete" ? "destructive" : "default"}
              onClick={() => startProgressFlow(confirmKind)}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={progressOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelProgressFlow();
            return;
          }
          setProgressOpen(open);
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
                ? progressMode === "delete"
                  ? "Quiz deleted"
                  : progressMode === "update"
                    ? "Changes saved"
                    : "Quiz created"
                : progressError
                  ? progressMode === "delete"
                    ? "Delete failed"
                    : "Save failed"
                  : actionRunning
                    ? progressMode === "delete"
                      ? "Deleting quiz"
                      : "Saving quiz"
                    : progressMode === "delete"
                      ? "Preparing to delete"
                      : "Preparing to save"}
            </DialogTitle>
            <DialogDescription>
              {progressDone
                ? progressMode === "delete"
                  ? "The quiz and its attempts have been removed."
                  : "Your quiz is ready. You can close this window."
                : progressError
                  ? progressError
                  : actionRunning
                    ? "Please wait while we finish this action…"
                    : "This step takes about 30 seconds. You can cancel before it completes."}
            </DialogDescription>
          </DialogHeader>

          {!progressDone && !progressError ? (
            <div className="space-y-3 py-2">
              <Progress value={progress} className="h-2.5" />
              <p className="text-center text-sm font-semibold tabular-nums text-primary">
                {Math.round(progress)}%
              </p>
              {!actionRunning ? (
                <p className="text-center text-xs text-muted-foreground">
                  You can cancel to stop without applying changes.
                </p>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Finalizing now — please wait a moment.
                </p>
              )}
            </div>
          ) : null}

          {progressDone || progressError ? (
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  resetProgressState();
                  setProgressOpen(false);
                }}
              >
                {progressDone ? "Done" : "Close"}
              </Button>
            </DialogFooter>
          ) : !actionRunning ? (
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={cancelProgressFlow}>
                Cancel
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>
    </InstructorShell>
  );
}
