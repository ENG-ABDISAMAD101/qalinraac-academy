"use client";

import { Download, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StudentShell } from "@/components/student/StudentShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  downloadFileById,
  getApiErrorMessage,
  mediaPublicUrl,
  studentResourcesRequest,
  type StudentResource,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

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

export default function ResourcesPage() {
  const [q, setQ] = useState("");
  const [resources, setResources] = useState<StudentResource[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await studentResourcesRequest();
        if (!cancelled) setResources(data);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load resources."));
          setResources([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return resources;
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(needle) ||
        r.courseTitle.toLowerCase().includes(needle) ||
        r.originalName.toLowerCase().includes(needle) ||
        (r.mentor?.fullName.toLowerCase().includes(needle) ?? false),
    );
  }, [resources, q]);

  async function handleDownload(fileId: string, filename: string) {
    if (!fileId) return;
    setFileError("");
    try {
      await downloadFileById(fileId, filename);
    } catch {
      setFileError("Could not download the file. Try again.");
    }
  }

  return (
    <StudentShell>
      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Resources
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Download PDF, DOCX, PPTX, XLSX, and ZIP materials
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search resources"
              className="pl-11"
            />
          </div>
        </div>

        {fileError ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {fileError}
          </p>
        ) : null}

        {loading ? (
          <div className="flex min-h-[14rem] items-center justify-center">
            <Spinner label="Loading resources" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
            <h2 className="font-display text-xl font-bold text-primary dark:text-foreground">
              No resources available
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Course materials shared by your instructors will appear here once
              they are published for your enrollments.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((r) => {
              const open = openId === r.id;
              const badge = typeBadge(r.mimeType, r.originalName);
              const instructorName = r.mentor?.fullName ?? "Instructor";
              return (
                <article
                  key={r.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : r.id)}
                    className="flex w-full items-start justify-between gap-3 p-4 text-left sm:p-5"
                    aria-expanded={open}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        {badge} · {r.originalName}
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-foreground">
                        {r.title}
                      </h2>
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
                      <div className="flex flex-col gap-4 border-t border-border px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              Course
                            </p>
                            <p className="mt-1 truncate text-sm font-bold text-foreground">
                              {r.courseTitle}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              Instructor
                            </p>
                            <div className="mt-1.5 flex items-center gap-2.5">
                              <Avatar className="h-8 w-8 border border-border">
                                <AvatarImage
                                  src={mediaPublicUrl(r.mentor?.avatarUrl)}
                                  alt={instructorName}
                                />
                                <AvatarFallback className="text-[10px] font-semibold text-foreground">
                                  {initialsFromName(instructorName)}
                                </AvatarFallback>
                              </Avatar>
                              <p className="truncate text-sm font-bold text-foreground">
                                {instructorName}
                              </p>
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              Resource file
                            </p>
                            <p className="mt-1 truncate text-sm font-bold text-foreground">
                              {r.originalName}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          className="shrink-0 rounded-xl"
                          disabled={!r.fileAssetId}
                          onClick={() =>
                            void handleDownload(r.fileAssetId, r.originalName)
                          }
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </StudentShell>
  );
}
