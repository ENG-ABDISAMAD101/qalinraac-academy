"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { EnrolledCourseCard } from "@/components/student/StudentCourseCard";
import { StudentShell } from "@/components/student/StudentShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  studentCoursesRequest,
  type StudentCourseCard,
} from "@/lib/api";

export default function MyCoursesPage() {
  const [q, setQ] = useState("");
  const [courses, setCourses] = useState<StudentCourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const activeCourses = useMemo(
    () => courses.filter((c) => c.status === "active"),
    [courses],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return activeCourses;
    return activeCourses.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) ||
        c.instructor?.fullName.toLowerCase().includes(needle),
    );
  }, [activeCourses, q]);

  const hasActive = activeCourses.length > 0;

  return (
    <StudentShell>
      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
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
            <div className="rounded-[1.5rem] border border-border bg-card px-6 py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No courses match your search.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((course) => (
                <EnrolledCourseCard
                  key={course.id}
                  courseId={course.courseId}
                  title={course.title}
                  thumbnailUrl={course.thumbnailUrl}
                  progressPercent={course.progressPercent}
                  watched={course.watched}
                  total={course.total}
                />
              ))}
            </div>
          )
        ) : (
          <div className="rounded-[1.5rem] border border-border bg-card px-6 py-14 text-center shadow-sm">
            <h2 className="font-display text-xl font-bold text-primary dark:text-foreground">
              No active courses
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              You are not enrolled in any active course yet. Browse the catalog
              to find a program and complete checkout to start learning.
            </p>
            <Button asChild className="mt-6 rounded-2xl px-6">
              <Link href="/courses">Browse courses</Link>
            </Button>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
