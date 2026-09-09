"use client";

import { useEffect, useState } from "react";
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
import { Check, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
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
import {
  getApiErrorMessage,
  instructorAddModuleRequest,
  instructorDeleteModuleRequest,
  instructorReorderCurriculumRequest,
  instructorUpdateModuleRequest,
  type InstructorModule,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { sectionLabel, type StepProps } from "../types";

const MODULE_PREFIX = "module:";

function SortableSectionRow({
  module: mod,
  index,
  readOnly,
  busy,
  onRename,
  onDelete,
}: {
  module: InstructorModule;
  index: number;
  readOnly: boolean;
  busy: boolean;
  onRename: (title: string) => Promise<void>;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: `${MODULE_PREFIX}${mod.id}`,
      data: { type: "module", moduleId: mod.id },
      disabled: readOnly,
    });

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(mod.title);

  useEffect(() => {
    setTitle(mod.title);
  }, [mod.title]);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-border/70 bg-background px-3 py-3",
        isDragging && "z-10 opacity-85 shadow-lg",
      )}
    >
      {!readOnly ? (
        <button
          type="button"
          aria-label={`Reorder ${mod.title}`}
          className="cursor-grab rounded-md p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : (
        <span className="w-6" />
      )}

      {editing ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Input
            value={title}
            autoFocus
            maxLength={160}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Section title"
            className="min-w-[12rem] flex-1"
          />
          <Button
            type="button"
            size="sm"
            disabled={!title.trim() || busy}
            onClick={async () => {
              await onRename(title.trim());
              setEditing(false);
            }}
          >
            <Check className="h-4 w-4" />
            Save
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setTitle(mod.title);
              setEditing(false);
            }}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {sectionLabel(index)}
            </p>
            <p className="truncate text-sm font-bold text-foreground">
              {mod.title}
            </p>
          </div>
          {!readOnly ? (
            <span className="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`Rename ${mod.title}`}
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${mod.title}`}
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </span>
          ) : null}
        </>
      )}
    </li>
  );
}

export function CurriculumStep({
  courseId,
  readOnly,
  curriculum,
  reloadCurriculum,
}: StepProps) {
  const [modules, setModules] = useState<InstructorModule[]>(curriculum);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    setModules(curriculum);
  }, [curriculum]);

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

  async function persistOrder(next: InstructorModule[]) {
    setModules(next);
    setBusy(true);
    setError("");
    try {
      await instructorReorderCurriculumRequest(courseId, {
        moduleIds: next.map((m) => m.id),
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save the new order."));
      await reloadCurriculum();
    } finally {
      setBusy(false);
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || readOnly) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId || !activeId.startsWith(MODULE_PREFIX)) return;

    const from = modules.findIndex(
      (m) => m.id === activeId.slice(MODULE_PREFIX.length),
    );
    const to = modules.findIndex(
      (m) => m.id === overId.slice(MODULE_PREFIX.length),
    );
    if (from < 0 || to < 0 || from === to) return;
    void persistOrder(arrayMove(modules, from, to));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="card-soft p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-primary dark:text-foreground">
              Curriculum
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create section titles for your course. Add lessons in the next
              step.
            </p>
          </div>
          {busy ? <Spinner className="sm" label="Saving sections" /> : null}
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {modules.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border px-4 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">
              No sections yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a section title such as “Getting Started”.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={modules.map((m) => `${MODULE_PREFIX}${m.id}`)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="mt-5 space-y-2">
                {modules.map((mod, index) => (
                  <SortableSectionRow
                    key={mod.id}
                    module={mod}
                    index={index}
                    readOnly={readOnly}
                    busy={busy}
                    onRename={(title) =>
                      run(
                        () => instructorUpdateModuleRequest(mod.id, { title }),
                        "Could not rename the section.",
                      )
                    }
                    onDelete={() =>
                      setPendingDelete({ id: mod.id, title: mod.title })
                    }
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {!readOnly ? (
        <form
          className="card-soft flex flex-wrap items-end gap-3 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newModuleTitle.trim()) return;
            const title = newModuleTitle.trim();
            void run(
              () => instructorAddModuleRequest(courseId, { title }),
              "Could not add the section.",
            ).then(() => setNewModuleTitle(""));
          }}
        >
          <div className="min-w-[15rem] flex-1 space-y-2">
            <Label htmlFor="new-section">Section title</Label>
            <Input
              id="new-section"
              value={newModuleTitle}
              maxLength={160}
              placeholder="e.g. Getting Started"
              onChange={(e) => setNewModuleTitle(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={!newModuleTitle.trim() || busy}>
            <Plus className="h-4 w-4" />
            Add section
          </Button>
        </form>
      ) : null}

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete section?</DialogTitle>
            <DialogDescription>
              “{pendingDelete?.title}” and all of its lessons will be permanently
              removed.
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
                  () => instructorDeleteModuleRequest(target.id),
                  "Could not delete the section.",
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
