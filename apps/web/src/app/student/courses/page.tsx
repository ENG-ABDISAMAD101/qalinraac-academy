"use client";

import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  browsePublishedCoursesRequest,
  enrollCourseRequest,
  studentCoursesRequest,
  type StudentCourseCard,
} from "@/lib/api";

type BrowseCourse = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  priceCents?: number;
};

export default function MyCoursesPage() {
  const [q, setQ] = useState("");
  const [courses, setCourses] = useState<StudentCourseCard[]>([]);
  const [browse, setBrowse] = useState<BrowseCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [browseError, setBrowseError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await studentCoursesRequest();
      setCourses(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load your courses. Please try again.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const hasActive = useMemo(
    () => courses.some((c) => c.status === "active"),
    [courses],
  );

  useEffect(() => {
    if (loading || hasActive) return;
    let cancelled = false;
    (async () => {
      setBrowseLoading(true);
      setBrowseError("");
      try {
        const data = await browsePublishedCoursesRequest();
        if (cancelled) return;
        setBrowse(Array.isArray(data.items) ? data.items : []);
      } catch {
        if (!cancelled) {
          setBrowseError(
            "Could not load published courses. Please try again.",
          );
          setBrowse([]);
        }
      } finally {
        if (!cancelled) setBrowseLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, hasActive]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return courses;
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) ||
        c.instructor?.fullName.toLowerCase().includes(needle),
    );
  }, [courses, q]);

  async function onEnroll(courseId: string) {
    setActionError("");
    setEnrollingId(courseId);
    try {
      await enrollCourseRequest(courseId);
      await loadCourses();
    } catch {
      setActionError("Enrollment failed. Please try again.");
    } finally {
      setEnrollingId(null);
    }
  }

  return (
    <StudentShell>
      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              My Courses
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Active enrollments with live progress tracking
            </p>
          </div>
          {hasActive ? (
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search courses"
                className="pl-11"
              />
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="flex min-h-[14rem] items-center justify-center">
            <Spinner label="Loading courses" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : hasActive ? (
          filtered.length === 0 ? (
            <div className="card-soft px-6 py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No courses match your search.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((course) => (
                <article
                  key={course.id}
                  className="card-soft overflow-hidden"
                >
                  <div className="relative aspect-[16/10] bg-canvas">
                    {course.thumbnailUrl ? (
                      <Image
                        src={course.thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No thumbnail
                      </div>
                    )}
                  </div>
                  <div className="space-y-3 p-5">
                    <h2 className="text-lg font-bold text-ink dark:text-foreground">
                      {course.title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Instructor ·{" "}
                      {course.instructor?.fullName ?? "Qalinraac Academy"}
                    </p>
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{course.progressPercent}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
                        <div
                          className="h-full rounded-full bg-brand-lime"
                          style={{
                            width: `${Math.min(
                              Math.max(course.progressPercent, 0),
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <Button asChild className="mt-1 w-full sm:w-auto">
                      <Link href={`/student/learn/${course.courseId}`}>
                        Continue
                      </Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-8">
            <div className="card-soft px-6 py-12 text-center">
              <h2 className="font-display text-xl font-bold text-brand-navy dark:text-foreground">
                No active courses yet
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Enroll in a published course below to start learning. Your
                progress will appear here once enrollment is active.
              </p>
            </div>

            <section className="space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-brand-navy dark:text-foreground">
                  Browse courses
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Published programs available for enrollment
                </p>
              </div>

              {actionError ? (
                <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {actionError}
                </p>
              ) : null}

              {browseLoading ? (
                <div className="flex min-h-[10rem] items-center justify-center">
                  <Spinner label="Loading catalog" />
                </div>
              ) : browseError ? (
                <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {browseError}
                </p>
              ) : browse.length === 0 ? (
                <div className="card-soft px-6 py-10 text-center text-sm text-muted-foreground">
                  No published courses are available right now.
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {browse.map((course) => (
                    <article
                      key={course.id}
                      className="card-soft overflow-hidden"
                    >
                      <div className="relative aspect-[16/10] bg-canvas">
                        {course.thumbnailUrl ? (
                          <Image
                            src={course.thumbnailUrl}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            No thumbnail
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 p-5">
                        <h3 className="text-lg font-bold text-ink dark:text-foreground">
                          {course.title}
                        </h3>
                        {course.description ? (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {course.description}
                          </p>
                        ) : null}
                        <Button
                          type="button"
                          disabled={enrollingId === course.id}
                          onClick={() => void onEnroll(course.id)}
                        >
                          {enrollingId === course.id ? "Enrolling…" : "Enroll"}
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
