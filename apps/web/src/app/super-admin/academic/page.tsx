"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  academicActivationsRequest,
  academicApproveActivationRequest,
  academicRejectActivationRequest,
  api,
  approveCourseRequest,
  getApiErrorMessage,
  requestCourseChangesRequest,
} from "@/lib/api";

type PendingCourse = {
  _id?: string;
  id?: string;
  title: string;
  status: string;
  submittedAt?: string;
};

type PendingActivation = {
  id: string;
  student?: string;
  course?: string;
  priceCents?: number;
  status?: string;
  requestedAt?: string;
};

export default function SuperAdminAcademicPage() {
  const [flash, setFlash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingCourses, setPendingCourses] = useState<PendingCourse[]>([]);
  const [pendingActivations, setPendingActivations] = useState<
    PendingActivation[]
  >([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [{ data }, activations] = await Promise.all([
        api.get<{
          data: PendingCourse[] | { items: PendingCourse[] };
        }>("/courses", { params: { status: "pending_review", limit: 50 } }),
        academicActivationsRequest("pending"),
      ]);
      const payload = data.data;
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      setPendingCourses(items);
      setPendingActivations(activations as PendingActivation[]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load academic queues."));
      setPendingCourses([]);
      setPendingActivations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(course: PendingCourse) {
    const id = String(course.id ?? course._id ?? "");
    if (!id) return;
    setBusyId(id);
    setFlash(null);
    try {
      await approveCourseRequest(id);
      setFlash(`Approved ${course.title} → Published.`);
      await load();
    } catch (err) {
      setFlash(getApiErrorMessage(err, "Approve failed."));
    } finally {
      setBusyId(null);
    }
  }

  async function requestChanges(course: PendingCourse) {
    const id = String(course.id ?? course._id ?? "");
    if (!id) return;
    setBusyId(id);
    setFlash(null);
    try {
      await requestCourseChangesRequest(id, "Please revise and resubmit.");
      setFlash(`Requested changes for ${course.title} → Draft.`);
      await load();
    } catch (err) {
      setFlash(getApiErrorMessage(err, "Request changes failed."));
    } finally {
      setBusyId(null);
    }
  }

  async function approveActivation(row: PendingActivation) {
    setBusyId(row.id);
    setFlash(null);
    try {
      await academicApproveActivationRequest(row.id);
      setFlash(`Activated ${row.student} → ${row.course}.`);
      await load();
    } catch (err) {
      setFlash(getApiErrorMessage(err, "Activation approve failed."));
    } finally {
      setBusyId(null);
    }
  }

  async function rejectActivation(row: PendingActivation) {
    const reason = window.prompt("Rejection reason");
    if (!reason?.trim()) return;
    setBusyId(row.id);
    setFlash(null);
    try {
      await academicRejectActivationRequest(row.id, reason.trim());
      setFlash(`Rejected activation for ${row.student}.`);
      await load();
    } catch (err) {
      setFlash(getApiErrorMessage(err, "Activation reject failed."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SuperAdminShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Academic Control
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Final approval for activations · course review overrides
          </p>
        </div>

        {flash ? (
          <p className="text-sm font-medium text-brand-navy dark:text-brand-lime">
            {flash}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        <section className="card-soft overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold">Pending student activations</h2>
          </div>
          {loading ? (
            <div className="flex min-h-[8rem] items-center justify-center">
              <Spinner label="Loading queue" />
            </div>
          ) : pendingActivations.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              No activation requests waiting.
            </p>
          ) : (
            <ul className="divide-y divide-border/70">
              {pendingActivations.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                >
                  <div>
                    <p className="font-semibold">
                      {a.student} · {a.course}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      $
                      {((a.priceCents ?? 0) / 100).toFixed(0)}
                      {a.requestedAt
                        ? ` · ${new Date(a.requestedAt).toLocaleString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/academic/activations/${a.id}`}>View</Link>
                    </Button>
                    <Button
                      size="sm"
                      className="bg-brand-lime text-brand-navy hover:bg-brand-lime/90"
                      disabled={busyId === a.id}
                      onClick={() => void approveActivation(a)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === a.id}
                      onClick={() => void rejectActivation(a)}
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card-soft overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold">Pending course reviews</h2>
          </div>
          {loading ? (
            <div className="flex min-h-[8rem] items-center justify-center">
              <Spinner label="Loading queue" />
            </div>
          ) : pendingCourses.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              No courses pending review.
            </p>
          ) : (
            <ul className="divide-y divide-border/70">
              {pendingCourses.map((c) => {
                const id = String(c.id ?? c._id ?? "");
                return (
                  <li
                    key={id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div>
                      <p className="font-semibold">{c.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.submittedAt
                          ? new Date(c.submittedAt).toLocaleString()
                          : "Pending"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-brand-lime text-brand-navy hover:bg-brand-lime/90"
                        disabled={busyId === id}
                        onClick={() => void approve(c)}
                      >
                        Approve Course
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === id}
                        onClick={() => void requestChanges(c)}
                      >
                        Request Changes
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </SuperAdminShell>
  );
}
