"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardList,
  Eye,
  Pencil,
  Plus,
  Wallet,
  Banknote,
} from "lucide-react";
import { InstructorShell } from "@/components/instructor/InstructorShell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  formatMoney,
  getApiErrorMessage,
  instructorDashboardRequest,
  instructorOpenCourseEditorRequest,
  mediaPublicUrl,
  type InstructorDashboardData,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<InstructorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editBusyId, setEditBusyId] = useState<string | null>(null);

  const name = user?.fullName ?? "Instructor";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const dashboard = await instructorDashboardRequest();
        if (!cancelled) setData(dashboard);
      } catch (err) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(err, "Could not load your dashboard. Try again."),
          );
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = data?.stats;
  const canCreate = data?.canCreateCourse ?? false;
  const courseLimit = data?.courseLimit ?? 1;
  const recent = data?.recentCourses ?? [];

  const statCards = [
    { label: "Total Courses", value: stats?.totalCourses ?? 0 },
    { label: "Published", value: stats?.publishedCourses ?? 0 },
    { label: "In Progress", value: stats?.inProgressCourses ?? 0 },
    { label: "Draft", value: stats?.draftCourses ?? 0 },
    { label: "Total Students", value: stats?.totalStudents ?? 0 },
    {
      label: "Total Earnings",
      value: formatMoney(stats?.totalEarnings ?? 0),
    },
    {
      label: "Balance",
      value: formatMoney(stats?.availableBalance ?? 0),
    },
    {
      label: "Pending Withdrawal",
      value: formatMoney(stats?.pendingWithdrawal ?? 0),
    },
  ];

  async function onEditCourse(courseId: string) {
    setEditBusyId(courseId);
    try {
      const draft = await instructorOpenCourseEditorRequest(courseId);
      window.location.href = `/instructor/courses/${draft.id}/builder`;
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not open course editor."));
      setEditBusyId(null);
    }
  }

  return (
    <InstructorShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Welcome, {name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your courses, students, and earnings
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading dashboard" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((s) => (
                <div key={s.label} className="card-soft px-5 py-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <section>
              <h2 className="mb-4 text-lg font-bold text-primary dark:text-foreground">
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-2">
                {canCreate ? (
                  <Button asChild>
                    <Link href="/instructor/courses/new">
                      <Plus className="h-4 w-4" />
                      Create Course
                    </Link>
                  </Button>
                ) : (
                  <Button type="button" disabled>
                    <Plus className="h-4 w-4" />
                    Create Course
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href="/instructor/courses">
                    <BookOpen className="h-4 w-4" />
                    View Courses
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/instructor/assignments">
                    <ClipboardList className="h-4 w-4" />
                    View Assignments
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/instructor/earnings">
                    <Wallet className="h-4 w-4" />
                    View Earnings
                  </Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/instructor/withdrawals">
                    <Banknote className="h-4 w-4" />
                    Withdrawal
                  </Link>
                </Button>
              </div>
              {!canCreate ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Course limit reached ({courseLimit}).
                </p>
              ) : null}
            </section>

            <section>
              <h2 className="mb-4 text-lg font-bold text-primary dark:text-foreground">
                Recent Courses
              </h2>
              {recent.length === 0 ? (
                <div className="card-soft px-5 py-10 text-center text-sm text-muted-foreground">
                  No published courses yet. Create and publish a course to see
                  it here.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {recent.map((course) => {
                    const thumb = mediaPublicUrl(course.thumbnailUrl);
                    return (
                      <article
                        key={course.id}
                        className="card-soft overflow-hidden"
                      >
                        <div className="relative aspect-[16/10] bg-muted">
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-muted text-sm font-semibold text-primary dark:bg-[#1A1A1A]">
                              {course.title}
                            </div>
                          )}
                        </div>
                        <div className="space-y-3 p-5">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-foreground">
                              {course.title}
                            </h3>
                            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-foreground dark:bg-[#1A1A1A]">
                              Published
                            </span>
                          </div>
                          {course.description ? (
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {course.description}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">
                            {course.lessons ?? 0}{" "}
                            {(course.lessons ?? 0) === 1 ? "lesson" : "lessons"}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              asChild
                              size="icon"
                              variant="outline"
                              className="h-9 w-9"
                              title="View course"
                            >
                              <Link
                                href={`/instructor/courses/${course.id}`}
                                aria-label={`View ${course.title}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              className="h-9 w-9"
                              title="Edit course"
                              disabled={editBusyId === course.id}
                              onClick={() => void onEditCourse(course.id)}
                              aria-label={`Edit ${course.title}`}
                            >
                              {editBusyId === course.id ? (
                                <Spinner className="sm on-primary" label="Opening" />
                              ) : (
                                <Pencil className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </InstructorShell>
  );
}
