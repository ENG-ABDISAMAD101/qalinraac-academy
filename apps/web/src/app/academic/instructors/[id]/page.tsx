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
  academicInstructorRequest,
  getApiErrorMessage,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type InstructorDetail = {
  id: string;
  basic?: {
    fullName?: string;
    email?: string;
    phone?: string;
    isActive?: boolean;
  };
  performance?: {
    published?: number;
    pending?: number;
    rejected?: number;
    archived?: number;
    totalCourses?: number;
    totalStudents?: number;
    avgProgress?: number;
  };
};

export default function AcademicInstructorDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [instructor, setInstructor] = useState<InstructorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const data = (await academicInstructorRequest(id)) as InstructorDetail;
      setInstructor(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load instructor."));
      setInstructor(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const status = instructor?.basic?.isActive === false ? "Inactive" : "Active";
  const perf = instructor?.performance;

  return (
    <AcademicShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/academic/instructors">← Instructors</Link>
        </Button>

        {loading ? (
          <div className="flex min-h-[10rem] items-center justify-center">
            <Spinner label="Loading instructor" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : instructor ? (
          <div className="card-soft space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
                  {instructor.basic?.fullName ?? "Instructor"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {instructor.basic?.email ?? "—"} ·{" "}
                  {instructor.basic?.phone ?? "—"}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  academicStatusTone(status),
                )}
              >
                {status}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Published", perf?.published ?? 0],
                ["Pending", perf?.pending ?? 0],
                ["Rejected", perf?.rejected ?? 0],
                ["Archived", perf?.archived ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl bg-muted px-4 py-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">Total students</p>
                <p className="text-xl font-bold">
                  {perf?.totalStudents ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">Avg performance</p>
                <p className="text-xl font-bold">{perf?.avgProgress ?? 0}%</p>
              </div>
              <div className="rounded-2xl border border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">Courses</p>
                <p className="text-xl font-bold">
                  {perf?.totalCourses ?? 0}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AcademicShell>
  );
}
