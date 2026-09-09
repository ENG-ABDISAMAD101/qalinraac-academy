"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, HelpCircle, Plus, Trash2, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorMessage,
  instructorCreateAssignmentRequest,
  instructorCreateQuizRequest,
} from "@/lib/api";
import { sectionLabel, type StepProps } from "../types";

type DraftQuestion = {
  prompt: string;
  options: string[];
  correctIndex: number;
};

type AssessmentKind = "quiz" | "assignment";

const emptyQuestion = (): DraftQuestion => ({
  prompt: "",
  options: ["", ""],
  correctIndex: 0,
});

export function AssessmentStep({
  courseId,
  readOnly,
  curriculum,
}: StepProps) {
  const [selectedModuleId, setSelectedModuleId] = useState(
    () => curriculum[0]?.id ?? "",
  );
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [dialog, setDialog] = useState<AssessmentKind | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);

  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");

  useEffect(() => {
    if (!curriculum.some((m) => m.id === selectedModuleId)) {
      setSelectedModuleId(curriculum[0]?.id ?? "");
    }
  }, [curriculum, selectedModuleId]);

  const selectedModule = useMemo(
    () => curriculum.find((m) => m.id === selectedModuleId) ?? null,
    [curriculum, selectedModuleId],
  );

  const selectedModuleIndex = useMemo(
    () => curriculum.findIndex((m) => m.id === selectedModuleId),
    [curriculum, selectedModuleId],
  );

  const lessonOptions = selectedModule?.lessons ?? [];

  useEffect(() => {
    if (!lessonOptions.some((l) => l.id === selectedLessonId)) {
      setSelectedLessonId(lessonOptions[0]?.id ?? "");
    }
  }, [lessonOptions, selectedLessonId]);

  function resetQuizForm() {
    setQuizTitle("");
    setQuizDescription("");
    setQuestions([emptyQuestion()]);
    setError("");
  }

  function resetAssignmentForm() {
    setAssignmentTitle("");
    setAssignmentDescription("");
    setError("");
  }

  function openQuiz() {
    if (!selectedLessonId) {
      setError("Select a lesson first.");
      return;
    }
    resetQuizForm();
    setDialog("quiz");
  }

  function openAssignment() {
    if (!selectedLessonId) {
      setError("Select a lesson first.");
      return;
    }
    resetAssignmentForm();
    setDialog("assignment");
  }

  function patchQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  }

  async function createQuiz() {
    setError("");
    if (quizTitle.trim().length < 2) {
      setError("Quiz title must be at least 2 characters.");
      return;
    }
    if (!selectedLessonId) {
      setError("Select a lesson for this quiz.");
      return;
    }
    const cleaned = questions.map((q) => ({
      prompt: q.prompt.trim(),
      options: q.options.map((o) => o.trim()).filter(Boolean),
      correctIndex: q.correctIndex,
    }));
    if (cleaned.some((q) => !q.prompt)) {
      setError("Every question needs a prompt.");
      return;
    }
    if (cleaned.some((q) => q.options.length < 2 || q.options.length > 4)) {
      setError("Each question needs 2–4 answer options.");
      return;
    }
    if (cleaned.some((q) => q.correctIndex >= q.options.length)) {
      setError("Pick a valid correct answer for every question.");
      return;
    }

    setSaving(true);
    try {
      await instructorCreateQuizRequest({
        title: quizTitle.trim(),
        description: quizDescription.trim() || undefined,
        courseId,
        lessonId: selectedLessonId,
        questions: cleaned,
      });
      setDialog(null);
      resetQuizForm();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create the quiz."));
    } finally {
      setSaving(false);
    }
  }

  async function createAssignment() {
    setError("");
    if (assignmentTitle.trim().length < 2) {
      setError("Assignment title must be at least 2 characters.");
      return;
    }
    if (!selectedLessonId) {
      setError("Select the lesson this assignment belongs to.");
      return;
    }
    setSaving(true);
    try {
      await instructorCreateAssignmentRequest({
        title: assignmentTitle.trim(),
        description: assignmentDescription.trim() || undefined,
        courseId,
        lessonId: selectedLessonId,
      });
      setDialog(null);
      resetAssignmentForm();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create the assignment."));
    } finally {
      setSaving(false);
    }
  }

  const hasSections = curriculum.length > 0;
  const hasLessons = lessonOptions.length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card-soft space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-primary dark:text-foreground">
            Assessment
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional. Select a section and lesson, then add a quiz or
            assignment.
          </p>
        </div>

        {!hasSections ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">
              Create a section first
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add curriculum sections, then lessons, before assessments.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Select curriculum</Label>
                <Select
                  value={selectedModuleId || undefined}
                  onValueChange={setSelectedModuleId}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {curriculum.map((m, index) => (
                      <SelectItem key={m.id} value={m.id}>
                        {sectionLabel(index)} — {m.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select lesson</Label>
                <Select
                  value={selectedLessonId || undefined}
                  onValueChange={setSelectedLessonId}
                  disabled={readOnly || !hasLessons}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        hasLessons ? "Choose a lesson" : "No lessons yet"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {lessonOptions.map((lesson, index) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {index + 1}. {lesson.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedModule && hasLessons ? (
              <p className="text-xs text-muted-foreground">
                Linking to {sectionLabel(Math.max(0, selectedModuleIndex))} —{" "}
                {selectedModule.title}
              </p>
            ) : null}

            {error && !dialog ? (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            {!hasLessons ? (
              <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                Add lessons to this section before creating assessments.
              </p>
            ) : !readOnly ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={openQuiz}>
                  <HelpCircle className="h-4 w-4" />
                  Add Quiz
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={openAssignment}
                >
                  <ClipboardList className="h-4 w-4" />
                  Add Assignment
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <Dialog
        open={dialog === "quiz"}
        onOpenChange={(next) => {
          if (!next) {
            setDialog(null);
            resetQuizForm();
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add quiz</DialogTitle>
            <DialogDescription>
              Linked to the selected lesson.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-title">Quiz title</Label>
              <Input
                id="quiz-title"
                value={quizTitle}
                maxLength={160}
                onChange={(e) => setQuizTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quiz-description">Description</Label>
              <Textarea
                id="quiz-description"
                rows={2}
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                className="min-h-[4rem]"
              />
            </div>

            <div className="space-y-3">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-2xl border border-border/70 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Question {index + 1}
                    </p>
                    {questions.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove question ${index + 1}`}
                        onClick={() =>
                          setQuestions((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>

                  <Input
                    value={question.prompt}
                    placeholder="Question prompt"
                    onChange={(e) =>
                      patchQuestion(index, { prompt: e.target.value })
                    }
                  />

                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${index}`}
                          checked={question.correctIndex === optionIndex}
                          onChange={() =>
                            patchQuestion(index, { correctIndex: optionIndex })
                          }
                          aria-label={`Mark option ${optionIndex + 1} correct`}
                          className="h-4 w-4 shrink-0 accent-primary"
                        />
                        <Input
                          value={option}
                          placeholder={`Option ${optionIndex + 1}`}
                          onChange={(e) =>
                            patchQuestion(index, {
                              options: question.options.map((o, i) =>
                                i === optionIndex ? e.target.value : o,
                              ),
                            })
                          }
                          className="h-10"
                        />
                        {question.options.length > 2 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            aria-label={`Remove option ${optionIndex + 1}`}
                            onClick={() =>
                              patchQuestion(index, {
                                options: question.options.filter(
                                  (_, i) => i !== optionIndex,
                                ),
                                correctIndex:
                                  question.correctIndex >= optionIndex &&
                                  question.correctIndex > 0
                                    ? question.correctIndex - 1
                                    : question.correctIndex,
                              })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    ))}
                    {question.options.length < 4 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          patchQuestion(index, {
                            options: [...question.options, ""],
                          })
                        }
                      >
                        <Plus className="h-4 w-4" />
                        Add option
                      </Button>
                    ) : null}
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

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void createQuiz()}
            >
              {saving ? (
                <Spinner className="sm on-primary" label="Saving quiz" />
              ) : null}
              Create quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialog === "assignment"}
        onOpenChange={(next) => {
          if (!next) {
            setDialog(null);
            resetAssignmentForm();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add assignment</DialogTitle>
            <DialogDescription>
              Linked to the selected lesson.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignment-title">Assignment title</Label>
              <Input
                id="assignment-title"
                value={assignmentTitle}
                maxLength={160}
                onChange={(e) => setAssignmentTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignment-description">Description</Label>
              <Textarea
                id="assignment-description"
                rows={4}
                value={assignmentDescription}
                onChange={(e) => setAssignmentDescription(e.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void createAssignment()}
            >
              {saving ? (
                <Spinner className="sm on-primary" label="Saving assignment" />
              ) : null}
              Create assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
