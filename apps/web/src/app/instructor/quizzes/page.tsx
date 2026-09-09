"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  InstructorShell,
  statusTone,
} from "@/components/instructor/InstructorShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorMessage,
  instructorCourseLessonsRequest,
  instructorCoursesRequest,
  instructorCreateQuizRequest,
  instructorQuizResultsRequest,
  instructorQuizzesRequest,
  type InstructorCourse,
} from "@/lib/api";
import { cn } from "@/lib/utils";

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

type QuizResultRow = {
  id: string;
  name: string;
  score: number;
  passed: boolean;
  email?: string;
};

const emptyQuestion = (): QuestionDraft => ({
  prompt: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  points: 1,
});

export default function InstructorQuizzesPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [passingScore, setPassingScore] = useState("70");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsTitle, setResultsTitle] = useState("");
  const [results, setResults] = useState<QuizResultRow[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState("");

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await instructorQuizzesRequest(query);
      setItems(data.items);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load quizzes."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void load(q.trim() || undefined);
    }, 300);
    return () => clearTimeout(t);
  }, [q, load]);

  useEffect(() => {
    if (!createOpen) return;
    void (async () => {
      try {
        const data = await instructorCoursesRequest();
        setCourses(data.items);
      } catch {
        setCourses([]);
      }
    })();
  }, [createOpen]);

  useEffect(() => {
    if (!courseId) {
      setLessons([]);
      setLessonId("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await instructorCourseLessonsRequest(courseId);
        if (!cancelled) {
          setLessons(data.items);
          setLessonId("");
        }
      } catch {
        if (!cancelled) setLessons([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  function resetCreate() {
    setStep(0);
    setTitle("");
    setDescription("");
    setCourseId("");
    setLessonId("");
    setPassingScore("70");
    setQuestions([emptyQuestion()]);
    setFormError("");
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!title.trim() || !courseId) {
      setFormError("Title and course are required.");
      return;
    }
    const cleaned = questions
      .map((qq) => ({
        prompt: qq.prompt.trim(),
        options: qq.options.map((o) => o.trim()).filter(Boolean),
        correctIndex: qq.correctIndex,
        points: qq.points || 1,
      }))
      .filter((qq) => qq.prompt && qq.options.length >= 2);
    if (cleaned.length === 0) {
      setFormError("Add at least one question with two options.");
      return;
    }
    for (const qq of cleaned) {
      if (qq.correctIndex < 0 || qq.correctIndex >= qq.options.length) {
        setFormError("Each question needs a valid correct option.");
        return;
      }
    }
    setCreating(true);
    try {
      await instructorCreateQuizRequest({
        title: title.trim(),
        description: description.trim() || undefined,
        courseId,
        lessonId: lessonId || undefined,
        passingScore: Number(passingScore) || 70,
        questions: cleaned,
      });
      setCreateOpen(false);
      resetCreate();
      await load(q.trim() || undefined);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not create quiz."));
    } finally {
      setCreating(false);
    }
  }

  async function openResults(quiz: QuizItem) {
    setResultsOpen(true);
    setResultsTitle(quiz.title);
    setResults([]);
    setResultsError("");
    setResultsLoading(true);
    try {
      const raw = (await instructorQuizResultsRequest(quiz.id)) as {
        results?: QuizResultRow[];
      };
      setResults(Array.isArray(raw.results) ? raw.results : []);
    } catch (err) {
      setResultsError(getApiErrorMessage(err, "Could not load results."));
    } finally {
      setResultsLoading(false);
    }
  }

  return (
    <InstructorShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              Quizzes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create quizzes and review student results
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              resetCreate();
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Create Quiz
          </Button>
        </div>

        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search quizzes"
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
        ) : items.length === 0 ? (
          <div className="card-soft px-5 py-12 text-center text-sm text-muted-foreground">
            No quizzes found.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((quiz) => (
              <article
                key={quiz.id}
                className="card-soft flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <p className="font-semibold text-foreground">{quiz.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {quiz.courseTitle} · {quiz.questionCount} questions · Pass{" "}
                    {quiz.passingScore}%
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {quiz.attempts} attempts · Avg {quiz.avgScore}%
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void openResults(quiz)}
                >
                  View results
                </Button>
              </article>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(v) => {
          setCreateOpen(v);
          if (!v) resetCreate();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create quiz</DialogTitle>
            <DialogDescription>
              Step {step + 1} of 2 — {step === 0 ? "Details" : "Questions"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onCreate} className="space-y-4">
            {step === 0 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="q-title">Title</Label>
                  <Input
                    id="q-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-desc">Description</Label>
                  <Textarea
                    id="q-desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="q-course">Course</Label>
                    <select
                      id="q-course"
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm"
                      required
                    >
                      <option value="">Select course</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="q-lesson">Lesson (optional)</Label>
                    <select
                      id="q-lesson"
                      value={lessonId}
                      onChange={(e) => setLessonId(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm"
                      disabled={!courseId}
                    >
                      <option value="">None</option>
                      {lessons.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-pass">Passing score (%)</Label>
                  <Input
                    id="q-pass"
                    type="number"
                    min={0}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {questions.map((qq, qi) => (
                  <div
                    key={qi}
                    className="rounded-2xl border border-border/70 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-brand-navy dark:text-foreground">
                        Question {qi + 1}
                      </p>
                      {questions.length > 1 ? (
                        <button
                          type="button"
                          className="text-xs font-semibold text-red-600"
                          onClick={() =>
                            setQuestions((prev) =>
                              prev.filter((_, i) => i !== qi),
                            )
                          }
                        >
                          Remove
                        </button>
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
            )}

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            <DialogFooter className="gap-2">
              {step === 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                >
                  Back
                </Button>
              ) : null}
              {step === 0 ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (!title.trim() || !courseId) {
                      setFormError("Title and course are required.");
                      return;
                    }
                    setFormError("");
                    setStep(1);
                  }}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={creating}>
                  {creating ? (
                    <Spinner className="sm on-primary" label="Creating" />
                  ) : null}
                  Create quiz
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resultsOpen} onOpenChange={setResultsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{resultsTitle} — Results</DialogTitle>
          </DialogHeader>
          {resultsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner label="Loading results" />
            </div>
          ) : resultsError ? (
            <p className="text-sm text-destructive">{resultsError}</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attempts yet.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {results.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{r.score}%</span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                        statusTone(r.passed ? "Passed" : "Failed"),
                      )}
                    >
                      {r.passed ? "Passed" : "Failed"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </InstructorShell>
  );
}
