"use client";

import { useCallback, useEffect, useState } from "react";
import { AcademicShell } from "@/components/academic/AcademicShell";
import { Spinner } from "@/components/ui/spinner";
import { academicReportsRequest, getApiErrorMessage } from "@/lib/api";

type ReportsData = {
  students?: {
    total?: number;
    active?: number;
    completed?: number;
    avgProgress?: number;
  };
  instructors?: {
    total?: number;
    active?: number;
    published?: number;
    pending?: number;
    draft?: number;
    totalStudents?: number;
  };
  courses?: {
    total?: number;
    published?: number;
    pending?: number;
    draft?: number;
  };
  certificates?: {
    total?: number;
    pending?: number;
    approved?: number;
    ready?: number;
  };
};

export default function AcademicReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData((await academicReportsRequest()) as ReportsData);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load reports."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const students = data?.students;
  const instructors = data?.instructors;
  const courses = data?.courses;
  const certificates = data?.certificates;

  return (
    <AcademicShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Academic Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Students, instructors, courses, and certificates
          </p>
        </div>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading reports" />
          </div>
        ) : (
          <>
            <section>
              <h2 className="mb-3 text-lg font-bold">Student report</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Total", students?.total ?? 0],
                  ["Active", students?.active ?? 0],
                  ["Completed", students?.completed ?? 0],
                  ["Avg progress", `${students?.avgProgress ?? 0}%`],
                ].map(([label, value]) => (
                  <div key={String(label)} className="card-soft px-5 py-4">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Instructor report</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Total instructors", instructors?.total ?? 0],
                  ["Active instructors", instructors?.active ?? 0],
                  ["Published courses", instructors?.published ?? 0],
                  ["Pending courses", instructors?.pending ?? 0],
                  ["Draft courses", instructors?.draft ?? 0],
                  ["Total students", instructors?.totalStudents ?? 0],
                ].map(([label, value]) => (
                  <div key={String(label)} className="card-soft px-5 py-4">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Course report</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Total", courses?.total ?? 0],
                  ["Published", courses?.published ?? 0],
                  ["Pending", courses?.pending ?? 0],
                  ["Draft", courses?.draft ?? 0],
                ].map(([label, value]) => (
                  <div key={String(label)} className="card-soft px-5 py-4">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">Certificate report</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Total requests", certificates?.total ?? 0],
                  ["Pending", certificates?.pending ?? 0],
                  ["Approved", certificates?.approved ?? 0],
                  ["Ready", certificates?.ready ?? 0],
                ].map(([label, value]) => (
                  <div key={String(label)} className="card-soft px-5 py-4">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AcademicShell>
  );
}
