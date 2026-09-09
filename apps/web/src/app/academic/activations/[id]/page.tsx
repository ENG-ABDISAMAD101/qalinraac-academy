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
  academicActivationRequest,
  getApiErrorMessage,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type ActivationDetail = {
  id: string;
  student?: { fullName?: string; email?: string };
  course?: { title?: string } | string;
  price?: number;
  priceCents?: number;
  status?: string;
  progress?: number;
  requestedAt?: string;
  activatedAt?: string;
  rejectionReason?: string;
};

function activationStatusLabel(status?: string) {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

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

export default function AcademicActivationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [item, setItem] = useState<ActivationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      setItem((await academicActivationRequest(id)) as ActivationDetail);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load activation."));
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusLabel = activationStatusLabel(item?.status);
  const courseTitle =
    typeof item?.course === "string"
      ? item.course
      : item?.course?.title ?? "—";
  const dollars =
    typeof item?.price === "number"
      ? item.price
      : typeof item?.priceCents === "number"
        ? item.priceCents / 100
        : 0;

  return (
    <AcademicShell>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/academic/activations">← Activations</Link>
        </Button>

        {loading ? (
          <div className="flex min-h-[10rem] items-center justify-center">
            <Spinner label="Loading activation" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : item ? (
          <div className="card-soft space-y-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-2xl font-bold text-primary dark:text-foreground">
                Activation request
              </h1>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  academicStatusTone(statusLabel),
                )}
              >
                {statusLabel}
              </span>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Student</dt>
                <dd className="font-semibold">
                  {item.student?.fullName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Course</dt>
                <dd className="font-semibold">{courseTitle}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Price</dt>
                <dd className="font-semibold">${dollars.toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Requested</dt>
                <dd className="font-semibold">
                  {formatDate(item.requestedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Progress</dt>
                <dd className="font-semibold">
                  {item.status === "active" || item.status === "completed"
                    ? `${item.progress ?? 0}%`
                    : "Not activated"}
                </dd>
              </div>
              {item.activatedAt ? (
                <div>
                  <dt className="text-muted-foreground">Activated</dt>
                  <dd className="font-semibold">
                    {formatDate(item.activatedAt)}
                  </dd>
                </div>
              ) : null}
            </dl>
            {item.rejectionReason ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
                Rejection reason: {item.rejectionReason}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Academic cannot manually edit progress. Final approval is by Super
              Admin.
            </p>
          </div>
        ) : null}
      </div>
    </AcademicShell>
  );
}
