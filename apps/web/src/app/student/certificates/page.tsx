"use client";

import { Download, Eye } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  certificatesMineTyped,
  getApiErrorMessage,
  requestCertificateApi,
  studentCoursesRequest,
  type StudentCourseCard,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type CertificateRow = {
  id: string;
  status: string;
  recipientName?: string;
  fileUrl?: string;
  filePath?: string;
  courseName: string;
  createdAt?: string;
};

function courseNameFrom(raw: {
  _id?: string;
  id?: string;
  status: string;
  recipientName?: string;
  fileUrl?: string;
  filePath?: string;
  createdAt?: string;
  courseId?:
    | string
    | { _id?: string; id?: string; title?: string; slug?: string };
}): CertificateRow {
  let courseName = "Course";
  if (raw.courseId && typeof raw.courseId === "object") {
    courseName = raw.courseId.title ?? "Course";
  }
  return {
    id: raw.id ?? raw._id ?? "",
    status: raw.status,
    recipientName: raw.recipientName,
    fileUrl: raw.fileUrl,
    filePath: raw.filePath,
    courseName,
    createdAt: raw.createdAt,
  };
}

function formatStatus(status: string) {
  const key = status.toLowerCase();
  if (key === "pending") return "Pending";
  if (key === "approved") return "Approved";
  if (key === "issued" || key === "ready") return "Ready";
  if (key === "rejected") return "Rejected";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusTone(status: string) {
  const label = formatStatus(status);
  if (label === "Ready" || label === "Approved") {
    return "bg-brand-lime-soft text-brand-navy";
  }
  if (label === "Rejected") return "bg-destructive/10 text-destructive";
  return "bg-canvas text-brand-navy dark:bg-muted dark:text-foreground";
}

function canDownload(status: string) {
  const key = status.toLowerCase();
  return key === "issued" || key === "approved" || key === "ready";
}

function pdfFilename(courseName: string, fileUrl?: string, filePath?: string) {
  const fromUrl = (fileUrl || filePath || "").split("/").pop();
  if (fromUrl && fromUrl.toLowerCase().includes(".pdf")) return fromUrl;
  const slug = courseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || "certificate"}.pdf`;
}

export default function CertificatesPage() {
  const [certs, setCerts] = useState<CertificateRow[]>([]);
  const [courses, setCourses] = useState<StudentCourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mine, enrolled] = await Promise.all([
        certificatesMineTyped(),
        studentCoursesRequest(),
      ]);
      setCerts(mine.map(courseNameFrom).filter((c) => c.id));
      setCourses(
        enrolled.filter(
          (c) => c.status === "completed" || c.status === "active",
        ),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load certificates."));
      setCerts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!recipientName.trim() || !courseId || !confirmed) {
      setFormError("Complete all fields and confirm the declaration.");
      return;
    }
    setSubmitting(true);
    try {
      await requestCertificateApi({
        courseId,
        recipientName: recipientName.trim(),
        declarationAccepted: true,
      });
      setFormSuccess("Certificate request submitted successfully.");
      setRecipientName("");
      setCourseId("");
      setConfirmed(false);
      await load();
      setTimeout(() => setOpen(false), 800);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not submit request."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StudentShell>
      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              Certificates
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Request, track status, download, and verify
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" className="bg-brand-lime text-brand-navy hover:opacity-90">
                Request Certificate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Request Certificate</DialogTitle>
                <DialogDescription>
                  Submit your legal name and select a completed course for review.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Full name</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Magacaaga oo saddexan"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseId">Course</Label>
                  <select
                    id="courseId"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    required
                    className="flex h-11 w-full rounded-full border border-input bg-background px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select a course</option>
                    {courses.map((c) => (
                      <option key={c.courseId} value={c.courseId}>
                        {c.title}
                        {c.status === "completed" ? " (Completed)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-start gap-3 text-sm leading-snug">
                  <Checkbox
                    checked={confirmed}
                    onCheckedChange={(v) => setConfirmed(Boolean(v))}
                    className="mt-0.5"
                  />
                  <span>
                    I confirm that all information provided is correct.
                  </span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Certificate confirmation may take up to 24 hours.
                </p>
                {formError ? (
                  <p className="text-sm text-destructive">{formError}</p>
                ) : null}
                {formSuccess ? (
                  <p className="text-sm font-medium text-brand-navy dark:text-brand-lime">
                    {formSuccess}
                  </p>
                ) : null}
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit request"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex min-h-[14rem] items-center justify-center">
            <Spinner label="Loading certificates" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : certs.length === 0 ? (
          <div className="card-soft px-6 py-14 text-center">
            <h2 className="font-display text-xl font-bold text-brand-navy dark:text-foreground">
              No certificates yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              When you complete a course, request a certificate using the button
              above. Approved certificates will appear here for download.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {certs.map((c) => {
              const fileHref = c.fileUrl || c.filePath;
              const ready = canDownload(c.status) && Boolean(fileHref);
              return (
                <article
                  key={c.id}
                  className="card-soft flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-ink dark:text-foreground">
                        {c.courseName}
                      </h2>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold",
                          statusTone(c.status),
                        )}
                      >
                        {formatStatus(c.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      This certificate declares that you have successfully
                      completed {c.courseName}.
                    </p>
                    {ready ? (
                      <p className="text-xs text-muted-foreground">
                        PDF · {pdfFilename(c.courseName, c.fileUrl, c.filePath)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {ready ? (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="View certificate"
                          asChild
                        >
                          <a
                            href={fileHref}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          size="icon"
                          aria-label="Download certificate"
                          asChild
                        >
                          <a
                            href={fileHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="View certificate"
                          disabled
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          aria-label="Download certificate"
                          disabled
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
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
