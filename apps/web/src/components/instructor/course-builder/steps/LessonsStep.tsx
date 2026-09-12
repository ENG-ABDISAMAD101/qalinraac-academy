"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  instructorAddLessonRequest,
  instructorDeleteLessonRequest,
  instructorReorderCurriculumRequest,
  instructorUpdateLessonRequest,
  type InstructorLesson,
  type InstructorModule,
  type LessonOrderPayload,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { UploadCard } from "../UploadCard";
import { sectionLabel, type StepProps } from "../types";

const LESSON_PREFIX = "lesson:";

type LessonDialogState =
  | { mode: "create"; moduleId: string }
  | { mode: "edit"; moduleId: string; lesson: InstructorLesson };

function lessonOrdersFor(modules: InstructorModule[]): LessonOrderPayload[] {
  return modules.flatMap((m) =>
    m.lessons.map((l, index) => ({
      lessonId: l.id,
      moduleId: m.id,
      order: index + 1,
    })),
  );
}

function SortableLessonRow({
  lesson,
  index,
  readOnly,
  onEdit,
  onDelete,
}: {
  lesson: InstructorLesson;
  index: number;
  readOnly: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: `${LESSON_PREFIX}${lesson.id}`,
      data: { type: "lesson", lessonId: lesson.id },
      disabled: readOnly,
    });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border/60 bg-background px-2 py-2",
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      {!readOnly ? (
        <button
          type="button"
          aria-label={`Reorder ${lesson.title}`}
          className="cursor-grab rounded-md p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-6" />
      )}

      <button
        type="button"
        onClick={onEdit}
        className="min-w-0 flex-1 rounded-lg px-1 py-1 text-left transition-colors hover:bg-accent/40"
      >
        <span className="flex items-center gap-2">
          <span className="w-8 shrink-0 text-xs font-semibold text-muted-foreground">
            {index + 1}.
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {lesson.title}
          </span>
          {lesson.videoUrl ? (
            <Badge variant="lime" className="hidden sm:inline-flex">
              <Video className="mr-1 h-3 w-3" />
              Video
            </Badge>
          ) : null}
        </span>
      </button>

      {!readOnly ? (
        <span className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label={`Edit ${lesson.title}`}
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            aria-label={`Delete ${lesson.title}`}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </span>
      ) : null}
    </li>
  );
}

export function LessonsStep({
  courseId,
  readOnly,
  curriculum,
  reloadCurriculum,
}: StepProps) {
  const [modules, setModules] = useState<InstructorModule[]>(curriculum);
  const [selectedModuleId, setSelectedModuleId] = useState(
    () => curriculum[0]?.id ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const [lessonDialog, setLessonDialog] = useState<LessonDialogState | null>(
    null,
  );
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonSaving, setLessonSaving] = useState(false);
  const [lessonError, setLessonError] = useState("");

  useEffect(() => {
    setModules(curriculum);
    if (!curriculum.some((m) => m.id === selectedModuleId)) {
      setSelectedModuleId(curriculum[0]?.id ?? "");
    }
  }, [curriculum, selectedModuleId]);

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === selectedModuleId) ?? null,
    [modules, selectedModuleId],
  );
  const selectedIndex = useMemo(
    () => modules.findIndex((m) => m.id === selectedModuleId),
    [modules, selectedModuleId],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function run(action: () => Promise<unknown>, fallback: string) {
    setBusy(true);
    setError("");
    try {
      await action();
      await reloadCurriculum();
    } catch (err) {
      setError(getApiErrorMessage(err, fallback));
      await reloadCurriculum();
    } finally {
      setBusy(false);
    }
  }

  async function persistLessonOrder(nextLessons: InstructorLesson[]) {
    if (!selectedModule) return;
    const next = modules.map((m) =>
      m.id === selectedModule.id ? { ...m, lessons: nextLessons } : m,
    );
    setModules(next);
    setBusy(true);
    setError("");
    try {
      await instructorReorderCurriculumRequest(courseId, {
        lessonOrders: lessonOrdersFor(next),
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save the new order."));
      await reloadCurriculum();
    } finally {
      setBusy(false);
    }
  }

  function onDragEnd(event: DragEndEvent) {
    if (!selectedModule || readOnly) return;
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId || !activeId.startsWith(LESSON_PREFIX)) return;

    const lessons = selectedModule.lessons;
    const from = lessons.findIndex(
      (l) => l.id === activeId.slice(LESSON_PREFIX.length),
    );
    const to = lessons.findIndex(
      (l) => l.id === overId.slice(LESSON_PREFIX.length),
    );
    if (from < 0 || to < 0 || from === to) return;
    void persistLessonOrder(arrayMove(lessons, from, to));
  }

  function openCreateLesson() {
    if (!selectedModuleId) return;
    setLessonDialog({ mode: "create", moduleId: selectedModuleId });
    setLessonTitle("");
    setLessonContent("");
    setLessonVideoUrl("");
    setLessonError("");
  }

  function openEditLesson(lesson: InstructorLesson) {
    if (!selectedModuleId) return;
    setLessonDialog({ mode: "edit", moduleId: selectedModuleId, lesson });
    setLessonTitle(lesson.title);
    setLessonContent(lesson.content ?? "");
    setLessonVideoUrl(lesson.videoUrl ?? "");
    setLessonError("");
  }

  function closeLessonDialog() {
    setLessonDialog(null);
    setLessonError("");
  }

  async function saveLesson() {
    if (!lessonDialog || readOnly) return;
    const title = lessonTitle.trim();
    if (title.length < 1) {
      setLessonError("Lesson title is required.");
      return;
    }
    setLessonSaving(true);
    setLessonError("");
    try {
      if (lessonDialog.mode === "create") {
        await instructorAddLessonRequest(courseId, lessonDialog.moduleId, {
          title,
          content: lessonContent.trim() || undefined,
          videoUrl: lessonVideoUrl || undefined,
          contentType: lessonVideoUrl ? "video" : "article",
        });
      } else {
        await instructorUpdateLessonRequest(lessonDialog.lesson.id, {
          title,
          content: lessonContent.trim() || undefined,
          videoUrl: lessonVideoUrl || undefined,
          contentType: lessonVideoUrl ? "video" : "article",
        });
      }
      closeLessonDialog();
      await reloadCurriculum();
    } catch (err) {
      setLessonError(getApiErrorMessage(err, "Could not save the lesson."));
    } finally {
      setLessonSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card-soft space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-primary dark:text-foreground">
              Lessons
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a curriculum section, then add lessons with content and
              video.
            </p>
          </div>
          {busy ? <Spinner className="sm" label="Saving lessons" /> : null}
        </div>

        {modules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">
              Create a section first
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Go back to Curriculum and add at least one section title.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Select curriculum</Label>
              <Select
                value={selectedModuleId || undefined}
                onValueChange={setSelectedModuleId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a section" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((m, index) => (
                    <SelectItem key={m.id} value={m.id}>
                      {sectionLabel(index)} — {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error ? (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            {selectedModule ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {sectionLabel(Math.max(0, selectedIndex))} —{" "}
                    {selectedModule.title}
                  </p>
                  {!readOnly ? (
                    <Button type="button" size="sm" onClick={openCreateLesson}>
                      <Plus className="h-4 w-4" />
                      Add lesson
                    </Button>
                  ) : null}
                </div>

                {selectedModule.lessons.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                    No lessons in this section yet.
                  </p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
                  >
                    <SortableContext
                      items={selectedModule.lessons.map(
                        (l) => `${LESSON_PREFIX}${l.id}`,
                      )}
                      strategy={verticalListSortingStrategy}
                    >
                      <ul className="space-y-2">
                        {selectedModule.lessons.map((lesson, index) => (
                          <SortableLessonRow
                            key={lesson.id}
                            lesson={lesson}
                            index={index}
                            readOnly={readOnly}
                            onEdit={() => openEditLesson(lesson)}
                            onDelete={() =>
                              setPendingDelete({
                                id: lesson.id,
                                title: lesson.title,
                              })
                            }
                          />                        ))}
                      </ul>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>

      <Dialog
        open={Boolean(lessonDialog)}
        onOpenChange={(next) => {
          if (!next) closeLessonDialog();
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {lessonDialog?.mode === "create"
                ? "Add lesson"
                : "Edit lesson"}
            </DialogTitle>
            <DialogDescription>
              {lessonDialog?.mode === "create"
                ? "Add a lesson to this section with optional video."
                : "Update the lesson title, content, or video."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson title</Label>
              <Input
                id="lesson-title"
                value={lessonTitle}
                maxLength={160}
                disabled={readOnly}
                placeholder="e.g. Introduction to the topic"
                onChange={(e) => setLessonTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lesson-content">Lesson content</Label>
              <Textarea
                id="lesson-content"
                rows={8}
                disabled={readOnly}
                value={lessonContent}
                placeholder="Write lesson notes or a short description…"
                onChange={(e) => setLessonContent(e.target.value)}
                className="min-h-[10rem]"
              />
            </div>
            <UploadCard
              kind="video"
              label="Lesson video"
              hint="MP4 or WebM · optional"
              value={lessonVideoUrl || undefined}
              readOnly={readOnly}
              compact
              onChange={(url) => setLessonVideoUrl(url ?? "")}
            />
            {lessonError ? (
              <p className="text-sm text-destructive">{lessonError}</p>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={closeLessonDialog}>
              Cancel
            </Button>
            {!readOnly ? (
              <Button
                type="button"
                disabled={lessonSaving}
                onClick={() => void saveLesson()}
              >
                {lessonSaving ? (
                  <Spinner className="sm on-primary" label="Saving lesson" />
                ) : null}
                {lessonDialog?.mode === "create" ? "Add lesson" : "Save changes"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete lesson?</DialogTitle>
            <DialogDescription>
              “{pendingDelete?.title}” will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => {
                const target = pendingDelete;
                setPendingDelete(null);
                if (!target) return;
                void run(
                  () => instructorDeleteLessonRequest(target.id),
                  "Could not delete the lesson.",
                );
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
