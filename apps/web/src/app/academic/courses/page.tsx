"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AcademicShell } from "@/components/academic/AcademicShell";
import { Badge, courseStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import { Spinner } from "@/components/ui/spinner";
import { academicCoursesRequest, getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Pending Review", value: "pending_review" },
  { label: "Published", value: "published" },
] as const;

const COURSE_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
};

function courseStatusLabel(status: string) {
  return (
    COURSE_STATUS_LABEL[status] ??
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
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

type CourseRow = {
  id: string;
  title: string;
  instructor: string;
  students: number;
  lessons: number;
  status: string;
  createdAt: string;
};

export default function AcademicCoursesPage() {
  const [filter, setFilter] =
    useState<(typeof FILTERS)[number]["value"]>("all");
  const [q, setQ] = useState("");
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (status: string) => {
    setLoading(true);
    setError("");
    try {
      const all = await academicCoursesRequest(
        status === "all" ? undefined : status,
      );
      setCourses(
        all.filter(
          (c) => c.status !== "rejected" && c.status !== "archived",
        ),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load courses."));
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [load, filter]);

  const filtered = useMemo(() => {
    if (!q.trim()) return courses;
    const needle = q.trim().toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) ||
        c.instructor.toLowerCase().includes(needle),
    );
  }, [courses, q]);

  return (
    <AcademicShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              Courses
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Draft · Pending Review · Published — open View to manage status
            </p>
          </div>
          <label className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search course or instructor…"
              className="h-11 border-0 bg-background pl-11 shadow-sm"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                filter === f.value
                  ? "bg-brand-navy text-white dark:bg-brand-lime dark:text-brand-navy"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading courses" />
          </div>
        ) : (
          <ScrollTable minWidthClassName="min-w-[56rem]">
            <ScrollTableHead>
              <tr>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Instructor</th>
                <th className="px-5 py-3 font-medium">Students</th>
                <th className="px-5 py-3 font-medium">Lessons</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <StickyActionHead />
              </tr>
            </ScrollTableHead>
            <tbody>
              {filtered.length === 0 ? (
                <ScrollTableEmpty
                  colSpan={7}
                  message="No courses match this filter or search."
                />
              ) : (
                filtered.map((c) => {
                  const label = courseStatusLabel(c.status);
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-border/70 hover:bg-accent/40"
                    >
                      <td className="max-w-[16rem] px-5 py-4 font-semibold">
                        <span className="line-clamp-2">{c.title}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {c.instructor}
                      </td>
                      <td className="px-5 py-4">{c.students}</td>
                      <td className="px-5 py-4">{c.lessons}</td>
                      <td className="px-5 py-4">
                        <Badge variant={courseStatusBadgeVariant(c.status)}>
                          {label}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </td>
                      <StickyActionCell>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/academic/courses/${c.id}/review`}>
                            View
                          </Link>
                        </Button>
                      </StickyActionCell>
                    </tr>
                  );
                })
              )}
            </tbody>
          </ScrollTable>
        )}
      </div>
    </AcademicShell>
  );
}
