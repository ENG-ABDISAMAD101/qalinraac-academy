"use client";

import { Download, Eye, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StudentShell } from "@/components/student/StudentShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  api,
  downloadFileById,
  getApiErrorMessage,
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
        r.originalName.toLowerCase().includes(needle),
    );
  }, [resources, q]);

  async function handleFile(fileId: string, action: "view" | "download") {
    if (!fileId) return;
    setFileError("");
    try {
      if (action === "download") {
        await downloadFileById(fileId);
        return;
      }
      const response = await api.get<Blob>(`/files/${fileId}/download`, {
        responseType: "blob",
        timeout: 120_000,
      });
      const url = URL.createObjectURL(response.data);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setFileError("Could not open the file. Try again.");
    }
  }

  return (
    <StudentShell>
      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
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
          <div className="card-soft px-6 py-14 text-center">
            <h2 className="font-display text-xl font-bold text-brand-navy dark:text-foreground">
              No resources available
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Course materials shared by your instructors will appear here once
              they are published for your enrollments.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((r) => {
              const open = openId === r.id;
              const badge = typeBadge(r.mimeType, r.originalName);
              return (
                <article key={r.id} className="card-soft overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : r.id)}
                    className="w-full p-5 text-left transition-colors hover:bg-canvas/50 dark:hover:bg-muted/20"
                  >
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-lime">
                      {badge}
                    </p>
                    <h2 className="mt-2 text-lg font-bold text-ink dark:text-foreground">
                      {r.title}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {open ? "Hide details" : "View details"}
                    </p>
                  </button>

                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-200",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-4 border-t border-border/60 px-5 pb-5 pt-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Course</p>
                          <p className="text-sm font-semibold text-ink dark:text-foreground">
                            {r.courseTitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage
                              src={r.mentor?.avatarUrl}
                              alt={r.mentor?.fullName ?? "Mentor"}
                            />
                            <AvatarFallback>
                              {initialsFromName(r.mentor?.fullName ?? "Mentor")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs text-muted-foreground">Mentor</p>
                            <p className="text-sm font-semibold text-ink dark:text-foreground">
                              {r.mentor?.fullName ?? "Instructor"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Filename</p>
                          <p className="truncate text-sm font-medium text-ink dark:text-foreground">
                            {r.originalName}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="View resource"
                            disabled={!r.fileAssetId}
                            onClick={() => void handleFile(r.fileAssetId, "view")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            aria-label="Download resource"
                            disabled={!r.fileAssetId}
                            onClick={() =>
                              void handleFile(r.fileAssetId, "download")
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
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
