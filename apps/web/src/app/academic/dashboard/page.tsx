"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AcademicShell,
  academicStatusTone,
} from "@/components/academic/AcademicShell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  academicDashboardRequest,
  getApiErrorMessage,
  type AcademicDashboardData,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function fmtDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AcademicDashboardPage() {
  const [data, setData] = useState<AcademicDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await academicDashboardRequest();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load academic dashboard."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = data
    ? [
        { label: "Total Students", value: data.stats.totalStudents },
        { label: "Total Instructors", value: data.stats.totalInstructors },
        { label: "Published Courses", value: data.stats.publishedCourses },
        { label: "Draft Courses", value: data.stats.draftCourses },
        {
          label: "Pending Course Reviews",
          value: data.stats.pendingCourseReviews,
        },
        {
          label: "Pending Student Activations",
          value: data.stats.pendingActivations,
        },
        {
          label: "Pending Certificates",
          value: data.stats.pendingCertificates,
        },
      ]
    : [];

  return (
    <AcademicShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Academic Work Queue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reviews, activations, and certificates — no research or finance
          </p>
        </div>

        {loading ? (
          <Spinner center label="Loading work queue" />
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label} className="card-soft px-5 py-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-brand-navy dark:text-foreground">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <section className="card-soft overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="text-base font-bold text-brand-navy dark:text-foreground">
                  Pending Course Reviews
                </h2>
                <Button asChild size="sm" variant="outline">
                  <Link href="/academic/courses?status=pending_review">
                    View all
                  </Link>
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-y border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Course</th>
                      <th className="px-5 py-3 font-medium">Instructor</th>
                      <th className="px-5 py-3 font-medium">Submitted</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.pendingCourseReviews ?? []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-muted-foreground"
                        >
                          No courses waiting for review.
                        </td>
                      </tr>
                    ) : (
                      data!.pendingCourseReviews.map((row) => (
                        <tr key={row.id} className="border-b border-border/70">
                          <td className="px-5 py-4 font-semibold">
                            {row.course}
                          </td>
                          <td className="px-5 py-4">{row.instructor}</td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {fmtDate(row.submittedAt)}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-bold",
                                academicStatusTone(row.status),
                              )}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <Button asChild size="sm">
                              <Link
                                href={`/academic/courses/${row.id}/review`}
                              >
                                Review
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card-soft overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="text-base font-bold text-brand-navy dark:text-foreground">
                  Pending Student Activations
                </h2>
                <Button asChild size="sm" variant="outline">
                  <Link href="/academic/activations">View all</Link>
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-y border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Student</th>
                      <th className="px-5 py-3 font-medium">Course</th>
                      <th className="px-5 py-3 font-medium">Price</th>
                      <th className="px-5 py-3 font-medium">Requested</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.pendingActivations ?? []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-8 text-center text-muted-foreground"
                        >
                          No pending activations.
                        </td>
                      </tr>
                    ) : (
                      data!.pendingActivations.map((row) => (
                        <tr key={row.id} className="border-b border-border/70">
                          <td className="px-5 py-4 font-semibold">
                            {row.student}
                          </td>
                          <td className="px-5 py-4">{row.course}</td>
                          <td className="px-5 py-4">
                            ${(row.priceCents / 100).toFixed(0)}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {fmtDate(row.requestedAt)}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-bold",
                                academicStatusTone(row.status),
                              )}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/academic/activations/${row.id}`}>
                                View
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card-soft overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="text-base font-bold text-brand-navy dark:text-foreground">
                  Pending Certificates
                </h2>
                <Button asChild size="sm" variant="outline">
                  <Link href="/academic/certificates">View all</Link>
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-y border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Student</th>
                      <th className="px-5 py-3 font-medium">Course</th>
                      <th className="px-5 py-3 font-medium">Completion</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.pendingCertificates ?? []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-8 text-center text-muted-foreground"
                        >
                          No certificate requests waiting.
                        </td>
                      </tr>
                    ) : (
                      data!.pendingCertificates.map((row) => (
                        <tr key={row.id} className="border-b border-border/70">
                          <td className="px-5 py-4 font-semibold">
                            {row.student}
                          </td>
                          <td className="px-5 py-4">{row.course}</td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {fmtDate(row.completionDate)}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-bold",
                                academicStatusTone(row.status),
                              )}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <Button asChild size="sm">
                              <Link
                                href={`/academic/certificates/${row.id}`}
                              >
                                Review
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </AcademicShell>
  );
}
