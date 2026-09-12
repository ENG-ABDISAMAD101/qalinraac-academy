"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useRef, useState, useEffect } from "react";
import {
  AdminShell,
  adminStatusTone,
  formatAdminDate,
  formatAdminStatusLabel,
} from "@/components/admin/AdminShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  adminCertificateRequest,
  adminUploadCertificateRequest,
  getApiErrorMessage,
  mediaPublicUrl,
  uploadFileRequest,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

type CertDetail = {
  id: string;
  status: string;
  recipientName: string;
  fileUrl?: string;
  requestedAt?: string;
  issuedAt?: string;
  student: {
    name: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    status?: string;
  };
  course: {
    title: string;
  };
};

export default function AdminCertificateDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const fileRef = useRef<HTMLInputElement>(null);
  const [cert, setCert] = useState<CertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const raw = await adminCertificateRequest(id);
      const student = (raw.student ?? {}) as Record<string, unknown>;
      const course = (raw.course ?? {}) as Record<string, unknown>;
      setCert({
        id: String(raw.id ?? id),
        status: String(raw.status ?? "pending"),
        recipientName: String(raw.recipientName ?? student.name ?? "—"),
        fileUrl: raw.fileUrl ? String(raw.fileUrl) : undefined,
        requestedAt: raw.requestedAt ? String(raw.requestedAt) : undefined,
        issuedAt: raw.issuedAt ? String(raw.issuedAt) : undefined,
        student: {
          name: String(student.name ?? "—"),
          email: student.email ? String(student.email) : undefined,
          phone: student.phone ? String(student.phone) : undefined,
          avatarUrl: student.avatarUrl
            ? String(student.avatarUrl)
            : undefined,
          status: student.status ? String(student.status) : undefined,
        },
        course: {
          title: String(course.title ?? "—"),
        },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load certificate request."));
      setCert(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(file?: File | null) {
    if (!file || !id) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const uploaded = await uploadFileRequest(file);
      const filePath = uploaded.path || uploaded.url;
      if (!filePath) {
        throw new Error("Upload returned no file path");
      }
      await adminUploadCertificateRequest(id, {
        filePath,
        fileUrl: uploaded.url,
      });
      setMessage("Certificate file uploaded successfully.");
      await load();
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Could not upload certificate file."),
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/certificates">← Certificates</Link>
        </Button>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading certificate" />
          </div>
        ) : error && !cert ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : cert ? (
          <div className="space-y-4">
            {error ? (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-2xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
                {message}
              </p>
            ) : null}

            <div className="card-soft overflow-hidden">
              <div className="border-b border-border/70 bg-canvas px-6 py-8 dark:bg-muted/30">
                <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
                  <Avatar className="h-28 w-28 border-4 border-white shadow-md ring-1 ring-border">
                    <AvatarImage
                      src={mediaPublicUrl(cert.student.avatarUrl)}
                      alt={cert.student.name}
                    />
                    <AvatarFallback className="text-2xl font-bold text-primary">
                      {initialsFromName(cert.student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mt-4 min-w-0 flex-1 sm:mt-2">
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                      <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
                        {cert.student.name}
                      </h1>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold",
                          adminStatusTone(cert.status),
                        )}
                      >
                        {formatAdminStatusLabel(cert.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Certificate request · {cert.course.title}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8 p-6 sm:p-8">
                <dl className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Email", cert.student.email || "—"],
                    ["Phone", cert.student.phone || "—"],
                    ["Course", cert.course.title],
                    ["Recipient name", cert.recipientName],
                    ["Requested", formatAdminDate(cert.requestedAt)],
                    ["Issued", formatAdminDate(cert.issuedAt)],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-border/70 px-4 py-3"
                    >
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-1 font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>

                {cert.fileUrl ? (
                  <div className="rounded-2xl bg-muted/60 px-4 py-4">
                    <p className="text-xs text-muted-foreground">
                      Issued certificate file
                    </p>
                    <a
                      href={mediaPublicUrl(cert.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Open certificate file
                    </a>
                  </div>
                ) : null}

                <div className="space-y-3 rounded-2xl border border-border/70 p-5">
                  <h2 className="text-base font-bold text-primary dark:text-foreground">
                    Upload certificate
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Upload the issued certificate file for this student.
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground"
                    onChange={(e) => void onUpload(e.target.files?.[0])}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Spinner className="sm" label="Uploading" />
                      Uploading file…
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
