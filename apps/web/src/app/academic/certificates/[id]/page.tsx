"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AcademicShell,
  academicStatusTone,
} from "@/components/academic/AcademicShell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  academicApproveCertificateRequest,
  academicCertificateRequest,
  academicReadyCertificateRequest,
  academicRejectCertificateRequest,
  getApiErrorMessage,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type CertDetail = {
  id: string;
  student?: { fullName?: string; email?: string };
  course?: { title?: string };
  instructors?: { fullName?: string }[];
  completionDate?: string;
  progress?: number;
  certificateNumber?: string;
  status?: string;
  rawStatus?: string;
  rejectionReason?: string;
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

export default function AcademicCertificateReviewPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [cert, setCert] = useState<CertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      setCert((await academicCertificateRequest(id)) as CertDetail);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load certificate."));
      setCert(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const raw = cert?.rawStatus;
  const canApprove = raw === "pending";
  const canReady = raw === "pending" || raw === "approved";
  const canReject = raw === "pending" || raw === "approved";

  async function approve() {
    setBusy(true);
    setResult(null);
    try {
      await academicApproveCertificateRequest(id);
      setResult("Approved — processing to Ready");
      await load();
    } catch (err) {
      setResult(getApiErrorMessage(err, "Could not approve certificate."));
    } finally {
      setBusy(false);
    }
  }

  async function markReady() {
    setBusy(true);
    setResult(null);
    try {
      await academicReadyCertificateRequest(id);
      setResult("Certificate marked Ready.");
      await load();
    } catch (err) {
      setResult(getApiErrorMessage(err, "Could not mark certificate ready."));
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!reason.trim()) {
      setResult("Add a rejection reason first");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      await academicRejectCertificateRequest(id, reason.trim());
      setResult("Rejected — student notified");
      await load();
    } catch (err) {
      setResult(getApiErrorMessage(err, "Could not reject certificate."));
    } finally {
      setBusy(false);
    }
  }

  const instructorNames =
    cert?.instructors?.map((i) => i.fullName).filter(Boolean).join(", ") ||
    "—";

  return (
    <AcademicShell>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/academic/certificates">← Certificates</Link>
        </Button>

        {loading ? (
          <div className="flex min-h-[10rem] items-center justify-center">
            <Spinner label="Loading certificate" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : cert ? (
          <div className="card-soft space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-2xl font-bold text-brand-navy dark:text-foreground">
                Certificate review
              </h1>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  academicStatusTone(cert.status ?? ""),
                )}
              >
                {cert.status}
              </span>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Student</dt>
                <dd className="font-semibold">
                  {cert.student?.fullName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Course</dt>
                <dd className="font-semibold">{cert.course?.title ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Instructor</dt>
                <dd className="font-semibold">{instructorNames}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Completion</dt>
                <dd className="font-semibold">
                  {formatDate(cert.completionDate)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Progress</dt>
                <dd className="font-semibold">{cert.progress ?? 0}%</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Certificate #</dt>
                <dd className="font-semibold">
                  {cert.certificateNumber ?? "—"}
                </dd>
              </div>
            </dl>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ Verify student identity</li>
              <li>✓ Course completion & required lessons</li>
              <li>✓ Quizzes / assignments completed</li>
              <li>✓ Completion percentage</li>
            </ul>
            {cert.rejectionReason ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                Rejection reason: {cert.rejectionReason}
              </p>
            ) : null}
            <label className="block text-sm font-medium">
              Rejection reason
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border px-4 py-3"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-brand-lime text-brand-navy hover:bg-brand-lime/90"
                disabled={busy || !canApprove}
                onClick={() => void approve()}
              >
                {busy ? <Spinner className="sm" label="Working" /> : null}
                Approve
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy || !canReady}
                onClick={() => void markReady()}
              >
                Mark Ready
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={busy || !canReject}
                onClick={() => void reject()}
              >
                Reject
              </Button>
            </div>
            {result ? (
              <p className="text-sm font-medium text-brand-navy dark:text-brand-lime">
                {result}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </AcademicShell>
  );
}
