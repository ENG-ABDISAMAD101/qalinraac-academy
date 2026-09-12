"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Download, Eye, FolderOpen, Plus, Search, Trash2, X } from "lucide-react";
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
import { FileDropzone } from "@/components/ui/file-dropzone";
import { formSelectClassName } from "@/components/ui/form";
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
  mediaPublicUrl,
  uploadFileRequest,
  type InstructorCourse,
  type InstructorResource,
} from "@/lib/api";
import { cn } from "@/lib/utils";

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
  const [openId, setOpenId] = useState<string | null>(null);

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
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
    setSelectedFile(null);
    setUploadProgress(null);
    setFormError("");
    setModules([]);
  }

  async function onUploadFile(file: File | null) {
    setSelectedFile(file);
    setFileAssetId("");
    setFileName("");
    setUploadProgress(file ? 0 : null);
    if (!file) return;
    setUploading(true);
    setFormError("");
    const tick = window.setInterval(() => {
      setUploadProgress((p) =>
        p == null || p >= 90 ? p : Math.min(90, p + 8),
      );
    }, 120);
    try {
      const uploaded = await uploadFileRequest(file);
      if (!uploaded.id) {
        setFormError("Upload succeeded but file id is missing.");
        setUploadProgress(null);
        return;
      }
      setFileAssetId(uploaded.id);
      setFileName(uploaded.originalName || file.name);
      setUploadProgress(100);
      if (!title.trim()) {
        setTitle(file.name.replace(/\.[^.]+$/, ""));
      }
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not upload the file."));
      setUploadProgress(null);
      setSelectedFile(null);
    } finally {
      window.clearInterval(tick);
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
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
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
          <ul className="space-y-3">
            {items.map((resource) => {
              const open = openId === resource.id;
              const viewUrl = mediaPublicUrl(resource.file.url);
              return (
                <li
                  key={resource.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
                    onClick={() => setOpenId(open ? null : resource.id)}
                    aria-expanded={open}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {resource.originalName || resource.title}
                        </p>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground dark:bg-[#1A1A1A]">
                          {typeBadge(resource.mimeType, resource.originalName)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {resource.title}
                      </p>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border">
                      {open ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </span>
                  </button>

                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-200",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-3 border-t border-border px-4 pb-5 pt-3 sm:px-5">
                        <dl className="grid gap-2 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              Course
                            </dt>
                            <dd className="mt-0.5 font-medium text-foreground">
                              {resource.courseTitle}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              Lesson
                            </dt>
                            <dd className="mt-0.5 font-medium text-foreground">
                              {[resource.moduleTitle, resource.lessonTitle]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              File
                            </dt>
                            <dd className="mt-0.5 font-medium text-foreground">
                              {resource.originalName}
                              {resource.file.size
                                ? ` · ${formatBytes(resource.file.size)}`
                                : ""}
                            </dd>
                          </div>
                        </dl>
                        <div className="flex flex-wrap gap-2">
                          {viewUrl ? (
                            <Button asChild size="sm" variant="outline">
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </a>
                            </Button>
                          ) : null}
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
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[480px] overflow-y-auto gap-5">
          <DialogHeader>
            <DialogTitle>Upload resource</DialogTitle>
            <DialogDescription>
              Select curriculum and lesson, then upload the file.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-5">
            <FileDropzone
              id="res-file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.csv,image/*"
              formatsLabel="PDF, DOCX, PPTX, XLSX, ZIP"
              disabled={uploading || saving}
              file={selectedFile}
              progress={
                selectedFile
                  ? uploadProgress ?? (fileAssetId ? 100 : null)
                  : null
              }
              onFileChange={(next) => void onUploadFile(next)}
            />
            {fileAssetId && !selectedFile ? (
              <p className="text-xs text-muted-foreground">
                Uploaded: {fileName}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="res-course">Course</Label>
              <select
                id="res-course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className={formSelectClassName}
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
                className={formSelectClassName}
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
                className={formSelectClassName}
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
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="res-desc">Description (optional)</Label>
              <Textarea
                id="res-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}

            <DialogFormActions
              helpHref="/instructor/support"
              cancelLabel="Cancel"
              confirmLabel="Import"
              confirmLoading={saving}
              confirmDisabled={uploading || !fileAssetId}
              onCancel={() => setFormOpen(false)}
            />
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
              variant="outline"
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
