"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { AcademicShell } from "@/components/academic/AcademicShell";
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
import { Spinner } from "@/components/ui/spinner";
import {
  academicAgreementsRequest,
  academicCreateAgreementRequest,
  academicUpdateAgreementRequest,
  getApiErrorMessage,
  mediaPublicUrl,
  uploadFileRequest,
} from "@/lib/api";

type AgreementRow = {
  id: string;
  title: string;
  version: string;
  effectiveDate?: string;
  uploadedAt?: string;
  status: string;
  fileUrl?: string;
  description?: string;
};

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function agreementStatusLabel(status: string) {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

export default function AcademicAgreementsPage() {
  const [rows, setRows] = useState<AgreementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AgreementRow | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const primary = rows[0] ?? null;
  const canCreate = rows.length === 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows((await academicAgreementsRequest()) as AgreementRow[]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load agreements."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setDescription("");
    setVersion("1.0");
    setEffectiveDate("");
    setFile(null);
    setFormError("");
    setDialogOpen(true);
  }

  function openEdit(row: AgreementRow) {
    setEditing(row);
    setTitle(row.title);
    setDescription(row.description ?? "");
    setVersion(row.version || "1.0");
    setEffectiveDate(
      row.effectiveDate
        ? new Date(row.effectiveDate).toISOString().slice(0, 10)
        : "",
    );
    setFile(null);
    setFormError("");
    setDialogOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!editing && !file) {
      setFormError("Select a PDF file to upload.");
      return;
    }
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }
    setSaving(true);
    try {
      let fileUrl = editing?.fileUrl;
      let fileName: string | undefined;
      if (file) {
        const uploaded = await uploadFileRequest(file);
        if (!uploaded.url) throw new Error("Upload returned no URL");
        fileUrl = uploaded.url;
        fileName = uploaded.originalName || file.name;
      }
      if (!fileUrl) {
        setFormError("A PDF file is required.");
        return;
      }

      if (editing) {
        await academicUpdateAgreementRequest(editing.id, {
          title: title.trim(),
          description: description.trim(),
          fileUrl,
          fileName,
          version: version.trim() || "1.0",
          effectiveDate: effectiveDate || undefined,
          status: "active",
        });
      } else {
        await academicCreateAgreementRequest({
          title: title.trim(),
          description: description.trim(),
          fileUrl,
          fileName,
          version: version.trim() || "1.0",
          effectiveDate: effectiveDate || undefined,
          status: "active",
        });
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not save agreement."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AcademicShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              Instructor Agreements
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              One active agreement · instructors can view and download only
            </p>
          </div>
          {canCreate ? (
            <Button type="button" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create agreement
            </Button>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="overflow-hidden card-soft">
          {loading ? (
            <div className="flex min-h-[10rem] items-center justify-center">
              <Spinner label="Loading agreements" />
            </div>
          ) : !primary ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No agreement yet. Create the instructor agreement to get started.
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Title</th>
                  <th className="px-5 py-3 font-medium">Version</th>
                  <th className="px-5 py-3 font-medium">Effective</th>
                  <th className="px-5 py-3 font-medium">Uploaded</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/70">
                  <td className="px-5 py-4 font-semibold">{primary.title}</td>
                  <td className="px-5 py-4">{primary.version}</td>
                  <td className="px-5 py-4">
                    {formatDate(primary.effectiveDate)}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatDate(primary.uploadedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      variant={
                        primary.status === "active" ? "lime" : "muted"
                      }
                    >
                      {agreementStatusLabel(primary.status)}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="h-9 w-9"
                        title="Edit agreement"
                        onClick={() => openEdit(primary)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {mediaPublicUrl(primary.fileUrl) ? (
                        <>
                          <Button asChild size="sm" variant="outline">
                            <a
                              href={mediaPublicUrl(primary.fileUrl)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View
                            </a>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <a
                              href={mediaPublicUrl(primary.fileUrl)}
                              download
                            >
                              Download
                            </a>
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit agreement" : "Create agreement"}
            </DialogTitle>
            <DialogDescription>
              Instructors can only view and download this agreement.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block text-sm font-medium">
              Title
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border px-4 py-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Description
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border px-4 py-3"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Version
                <input
                  required
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border px-4 py-3"
                />
              </label>
              <label className="block text-sm font-medium">
                Effective date
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border px-4 py-3"
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              PDF file {editing ? "(optional to replace)" : ""}
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="mt-2 block w-full text-sm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Spinner className="sm on-primary" label="Saving" />
                ) : null}
                {editing ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AcademicShell>
  );
}
