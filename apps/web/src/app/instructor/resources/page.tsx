"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  FileText,
  FolderOpen,
  Plus,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
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
  downloadFileById,
  getApiErrorMessage,
  instructorCourseCurriculumRequest,
  instructorCoursesRequest,
  instructorCreateResourceRequest,
  instructorDeleteResourceRequest,
  instructorResourcesRequest,
  uploadFileRequest,
  type InstructorCourse,
  type InstructorResource,
} from "@/lib/api";

function typeBadge(mimeType: string, originalName: string) {
  const name = originalName.toLowerCase();
  if (name.endsWith(".pdf") || mimeType.includes("pdf")) return "PDF";
  if (name.endsWith(".docx") || mimeType.includes("word")) return "DOCX";
  if (name.endsWith(".pptx") || mimeType.includes("presentation")) return "PPTX";
  if (name.endsWith(".xlsx") || mimeType.includes("sheet")) return "XLSX";
  if (name.endsWith(".zip") || mimeType.includes("zip")) return "ZIP";
  const ext = originalName.split(".").pop();
  return (ext || "FILE").toUpperCase().slice(0, 6);
}

function formatBytes(size?: number) {
  if (!size || size <= 0) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

type CurriculumModule = {
  id: string;
  title: string;
  lessons: { id: string; title: string }[];
};

export default function InstructorResourcesPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<InstructorResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [modules, setModules] = useState<CurriculumModule[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [fileAssetId, setFileAssetId] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [curriculumLoading, setCurriculumLoading] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<InstructorResource | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await instructorResourcesRequest(query);
      setItems(data.items);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load resources."));
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
      setModules([]);
      setModuleId("");
      setLessonId("");
      return;
    }
    let cancelled = false;
    setCurriculumLoading(true);
    void (async () => {
      try {
        const data = await instructorCourseCurriculumRequest(courseId);
        if (cancelled) return;
        setModules(data.modules);
        setModuleId("");
        setLessonId("");
      } catch {
        if (!cancelled) {
          setModules([]);
          setModuleId("");
          setLessonId("");
        }
      } finally {
        if (!cancelled) setCurriculumLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const selectedModule = useMemo(
    () => modules.find((m) => m.id === moduleId) ?? null,
    [modules, moduleId],
  );

  useEffect(() => {
    if (!selectedModule?.lessons.some((l) => l.id === lessonId)) {
      setLessonId("");
    }
  }, [selectedModule, lessonId]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setCourseId("");
    setModuleId("");
    setLessonId("");
    setFileAssetId("");
    setFileName("");
    setFormError("");
    setModules([]);
  }

  async function onUploadFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setFormError("");
    try {
      const uploaded = await uploadFileRequest(file);
      if (!uploaded.id) {
        setFormError("Upload succeeded but file id is missing.");
        return;
      }
      setFileAssetId(uploaded.id);
      setFileName(uploaded.originalName || file.name);
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, ""));
      }
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not upload the file."));
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!courseId || !moduleId || !lessonId) {
      setFormError("Select course, curriculum section, and lesson.");
      return;
    }
    if (!fileAssetId) {
      setFormError("Upload a resource file first.");
      return;
    }
    if (title.trim().length < 2) {
      setFormError("Title must be at least 2 characters.");
      return;
    }

    setSaving(true);
    try {
      await instructorCreateResourceRequest({
        title: title.trim(),
        description: description.trim() || undefined,
        courseId,
        moduleId,
        lessonId,
        fileAssetId,
      });
      setFormOpen(false);
      resetForm();
      await load(q.trim() || undefined);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not save the resource."));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await instructorDeleteResourceRequest(pendingDelete.id);
      setPendingDelete(null);
      await load(q.trim() || undefined);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not delete the resource."));
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <InstructorShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              Resources
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload PDFs, slides, and files tied to a curriculum lesson
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              resetForm();
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Upload Resource
          </Button>
        </div>

        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search resources"
            className="pl-11"
          />
        </label>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading resources" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : items.length === 0 ? (
          <div className="card-soft px-5 py-12 text-center">
            <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              No resources yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a file and link it to a curriculum lesson.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((resource) => (
              <article key={resource.id} className="card-soft flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-brand-navy/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-navy dark:bg-brand-lime/15 dark:text-brand-lime">
                    {typeBadge(resource.mimeType, resource.originalName)}
                  </span>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <h2 className="mt-3 line-clamp-2 font-semibold text-foreground">
                  {resource.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {resource.courseTitle}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[resource.moduleTitle, resource.lessonTitle]
                    .filter(Boolean)
                    .join(" · ") || "Course resource"}
                </p>
                <p className="mt-2 truncate text-xs text-muted-foreground">
                  {resource.originalName}
                  {resource.file.size
                    ? ` · ${formatBytes(resource.file.size)}`
                    : ""}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void downloadFileById(
                        resource.file.id,
                        resource.originalName,
                      ).catch((err) =>
                        setError(
                          getApiErrorMessage(
                            err,
                            "Could not download this resource.",
                          ),
                        ),
                      )
                    }
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setPendingDelete(resource)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload resource</DialogTitle>
            <DialogDescription>
              Select curriculum and lesson, then upload the file.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="res-course">Course</Label>
              <select
                id="res-course"
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
              <Label htmlFor="res-module">Curriculum</Label>
              <select
                id="res-module"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm"
                required
                disabled={!courseId || curriculumLoading}
              >
                <option value="">
                  {curriculumLoading
                    ? "Loading sections…"
                    : "Select curriculum section"}
                </option>
                {modules.map((m, index) => (
                  <option key={m.id} value={m.id}>
                    {String(index + 1).padStart(2, "0")} — {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="res-lesson">Lesson</Label>
              <select
                id="res-lesson"
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm"
                required
                disabled={!moduleId}
              >
                <option value="">Select lesson</option>
                {(selectedModule?.lessons ?? []).map((lesson, index) => (
                  <option key={lesson.id} value={lesson.id}>
                    {index + 1}. {lesson.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="res-title">Title</Label>
              <Input
                id="res-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={160}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="res-desc">Description (optional)</Label>
              <Textarea
                id="res-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="res-file">Resource file</Label>
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-5 text-center">
                {uploading ? (
                  <Spinner label="Uploading file" />
                ) : fileAssetId ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {fileName}
                    </p>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-brand-navy dark:text-brand-lime">
                      <UploadCloud className="h-3.5 w-3.5" />
                      Replace file
                      <input
                        id="res-file"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.csv,image/*"
                        onChange={(e) =>
                          void onUploadFile(e.target.files?.[0])
                        }
                      />
                    </label>
                  </div>
                ) : (
                  <label className="inline-flex cursor-pointer flex-col items-center gap-2">
                    <UploadCloud className="h-6 w-6 text-brand-navy dark:text-brand-lime" />
                    <span className="text-sm font-medium text-foreground">
                      Choose PDF, DOCX, PPTX, XLSX, or ZIP
                    </span>
                    <input
                      id="res-file"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.csv,image/*"
                      onChange={(e) => void onUploadFile(e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            </div>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving ? (
                  <Spinner className="sm on-primary" label="Saving resource" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
                Save resource
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete resource?</DialogTitle>
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
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? (
                <Spinner className="sm" label="Deleting" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </InstructorShell>
  );
}
