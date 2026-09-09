"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { InstructorShell } from "@/components/instructor/InstructorShell";
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
  instructorAssignmentsRequest,
  instructorCourseLessonsRequest,
  instructorCoursesRequest,
  instructorCreateAssignmentRequest,
  type InstructorCourse,
} from "@/lib/api";

type AssignmentItem = Awaited<
  ReturnType<typeof instructorAssignmentsRequest>
>["items"][number];

type LessonOption = { id: string; title: string; moduleId: string };

export default function InstructorAssignmentsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [loadingLessons, setLoadingLessons] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await instructorAssignmentsRequest();
      setItems(data.items);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load assignments."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const data = await instructorCoursesRequest();
        setCourses(data.items);
      } catch {
        setCourses([]);
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!courseId) {
      setLessons([]);
      setLessonId("");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingLessons(true);
      try {
        const data = await instructorCourseLessonsRequest(courseId);
        if (!cancelled) {
          setLessons(data.items);
          setLessonId("");
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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!title.trim() || !courseId || !lessonId) {
      setFormError("Title, course, and lesson are required.");
      return;
    }
    setCreating(true);
    try {
      const created = await instructorCreateAssignmentRequest({
        title: title.trim(),
        description: description.trim() || undefined,
        courseId,
        lessonId,
      });
      setOpen(false);
      setTitle("");
      setDescription("");
      setCourseId("");
      setLessonId("");
      router.push(`/instructor/assignments/${created.id}`);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not create assignment."));
    } finally {
      setCreating(false);
    }
  }

  return (
    <InstructorShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              Assignments
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create assignments and review student submissions
            </p>
          </div>
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Assignment
          </Button>
        </div>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading assignments" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : items.length === 0 ? (
          <div className="card-soft px-5 py-12 text-center text-sm text-muted-foreground">
            No assignments yet. Create one to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <Link
                key={a.id}
                href={`/instructor/assignments/${a.id}`}
                className="card-soft block p-5 transition hover:-translate-y-0.5"
              >
                <p className="font-semibold text-foreground">{a.title}</p>
                {a.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {a.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {a.courseTitle}
                  {a.lessonTitle ? ` · ${a.lessonTitle}` : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create assignment</DialogTitle>
            <DialogDescription>
              Attach the assignment to a course lesson.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="a-title">Title</Label>
              <Input
                id="a-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-desc">Description</Label>
              <Textarea
                id="a-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-course">Course</Label>
              <select
                id="a-course"
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
              <Label htmlFor="a-lesson">Lesson</Label>
              <select
                id="a-lesson"
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm"
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
            </div>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <Spinner className="sm on-primary" label="Creating" />
                ) : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </InstructorShell>
  );
}
