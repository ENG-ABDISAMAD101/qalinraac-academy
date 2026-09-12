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
  instructorAssignmentsRequest,
  instructorCourseLessonsRequest,
  instructorCoursesRequest,
  instructorCreateAssignmentRequest,
  instructorDeleteAssignmentRequest,
  instructorUpdateAssignmentRequest,
  type InstructorCourse,
} from "@/lib/api";

const ACTION_DURATION_MS = 30_000;

type ProgressKind = "save" | "delete";

type AssignmentItem = Awaited<
  ReturnType<typeof instructorAssignmentsRequest>
>["items"][number];

type LessonOption = { id: string; title: string; moduleId: string };

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

export default function InstructorAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [q, setQ] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AssignmentItem | null>(null);
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [formError, setFormError] = useState("");
  const [loadingLessons, setLoadingLessons] = useState(false);
  const preserveLessonRef = useRef(false);

  const [deleteTarget, setDeleteTarget] = useState<AssignmentItem | null>(null);

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
      const data = await instructorAssignmentsRequest();
      setAssignments(data.items);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load assignments."));
      setAssignments([]);
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

  const filteredAssignments = useMemo(() => {
    if (!q.trim()) return assignments;
    const needle = q.trim().toLowerCase();
    return assignments.filter(
      (a) =>
        a.title.toLowerCase().includes(needle) ||
        a.courseTitle.toLowerCase().includes(needle) ||
        (a.lessonTitle ?? "").toLowerCase().includes(needle),
    );
  }, [assignments, q]);

  function resetForm() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setCourseId("");
    setLessonId("");
    setFormError("");
    preserveLessonRef.current = false;
  }

  function openCreate() {
    resetForm();
    setFormOpen(true);
  }

  function openEdit(item: AssignmentItem) {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description ?? "");
    preserveLessonRef.current = true;
    setCourseId(item.courseId);
    setLessonId(item.lessonId ?? "");
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

  async function executeSave() {
    if (editing) {
      await instructorUpdateAssignmentRequest(editing.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        lessonId,
      });
      return "Assignment updated successfully.";
    }
    await instructorCreateAssignmentRequest({
      title: title.trim(),
      description: description.trim() || undefined,
      courseId,
      lessonId,
    });
    return "Assignment created successfully.";
  }

  async function executeDelete() {
    if (!deleteTarget) throw new Error("No assignment selected.");
    await instructorDeleteAssignmentRequest(deleteTarget.id);
    return "Assignment deleted successfully.";
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
              ? "Could not delete the assignment."
              : editing
                ? "Could not save assignment changes."
                : "Could not create the assignment.",
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
    setFormError("");
    if (!title.trim() || !courseId || !lessonId) {
      setFormError("Title, course, and lesson are required.");
      return;
    }
    setConfirmKind("save");
    setConfirmOpen(true);
  }

  function requestDelete(item: AssignmentItem) {
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
              Assignments
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage course assignments. Review student work in
              Submissions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/instructor/submissions">View submissions</Link>
            </Button>
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create Assignment
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
              Total assignments
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {assignments.length}
            </p>
          </div>
        </div>

        <label className="relative min-w-[16rem] max-w-md block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search assignment or course"
            className="pl-11"
          />
        </label>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading assignments" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : filteredAssignments.length === 0 ? (
          <div className="card-soft px-5 py-10 text-center text-sm text-muted-foreground">
            {assignments.length === 0
              ? "No assignments yet. Create one to get started."
              : "No assignments match your search."}
          </div>
        ) : (
          <section className="space-y-3">
            {filteredAssignments.map((a) => (
              <article
                key={a.id}
                className="card-soft flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{a.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {a.courseTitle}
                    {a.lessonTitle ? ` · ${a.lessonTitle}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Max score {a.maxScore}
                    {a.createdAt ? ` · ${formatDateTime(a.createdAt)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => requestDelete(a)}
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
        <DialogContent className="max-w-[460px] gap-5">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit assignment" : "Create assignment"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Update title, description, or lesson. Course stays the same."
                : "Attach the assignment to a course lesson."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSave} className="space-y-5">
            <FormField label="Title" htmlFor="a-title">
              <Input
                id="a-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Description" htmlFor="a-desc">
              <Textarea
                id="a-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>
            <FormField label="Course" htmlFor="a-course">
              <select
                id="a-course"
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
            <FormField label="Lesson" htmlFor="a-lesson">
              <select
                id="a-lesson"
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                className={formSelectClassName}
                required
                disabled={!courseId || loadingLessons}
              >
                <option value="">
                  {loadingLessons ? "Loading lessons…" : "Select lesson"}
                </option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </FormField>
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
                ? "Delete this assignment?"
                : editing
                  ? "Save assignment changes?"
                  : "Create this assignment?"}
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
                  . Student submissions linked to this assignment will also be
                  removed. This action cannot be undone after the process
                  finishes.
                </>
              ) : editing ? (
                <>
                  Please review your updates before continuing. Saving will
                  apply these changes for students attached to this assignment.
                  You can still cancel during the preparation step.
                </>
              ) : (
                <>
                  This will publish the assignment to the selected course
                  lesson. Students enrolled in the course will be able to view
                  and submit work. You can cancel during the preparation step.
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
                  ? "Assignment deleted"
                  : progressMode === "update"
                    ? "Changes saved"
                    : "Assignment created"
                : progressError
                  ? progressMode === "delete"
                    ? "Delete failed"
                    : "Save failed"
                  : actionRunning
                    ? progressMode === "delete"
                      ? "Deleting assignment"
                      : "Saving assignment"
                    : progressMode === "delete"
                      ? "Preparing to delete"
                      : "Preparing to save"}
            </DialogTitle>
            <DialogDescription>
              {progressDone
                ? progressMode === "delete"
                  ? "The assignment and its submissions have been removed."
                  : "Your assignment is ready. You can close this window."
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
