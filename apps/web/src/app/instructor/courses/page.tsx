"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, LayoutGrid, Pencil, Plus, Rows3, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { InstructorShell } from "@/components/instructor/InstructorShell";
import {
  TOTAL_STEPS,
  courseStatusLabel,
} from "@/components/instructor/course-builder/types";
import { Badge, courseStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  COURSE_CATEGORIES,
  courseCategoryLabel,
  formatMoney,
  getApiErrorMessage,
  instructorCoursesRequest,
  mediaPublicUrl,
  type InstructorCourse,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending Review" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "updated", label: "Recently updated" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
];

type SortKey = (typeof SORTS)[number]["value"];

function builderPercent(course: InstructorCourse) {
  if (course.status === "published") return 100;
  return Math.min(
    100,
    Math.round(((course.builderStep ?? 1) / TOTAL_STEPS) * 100),
  );
}

function canEditCourse(status: string) {
  return status !== "pending_review" && status !== "archived";
}

/** Primary builder CTA — always allow updates until pending review. */
function builderActionLabel(course: InstructorCourse) {
  if (course.status === "pending_review") return "Builder";
  if (course.status === "archived") return "Builder";
  if (course.status === "published") return "Update";
  if (course.status === "rejected") return "Update";
  if (builderPercent(course) >= 100) return "Update";
  return "Continue";
}

export default function InstructorCoursesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [items, setItems] = useState<InstructorCourse[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [courseLimit, setCourseLimit] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await instructorCoursesRequest();
        if (!cancelled) {
          setItems(data.items);
          setCanCreate(data.canCreateCourse);
          setCourseLimit(data.courseLimit);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load courses."));
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const courses = useMemo(() => {
    let list = [...items];
    if (status !== "all") list = list.filter((c) => c.status === status);
    if (category !== "all") list = list.filter((c) => c.category === category);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(needle) ||
          (c.subtitle ?? "").toLowerCase().includes(needle) ||
          (c.tags ?? []).some((tag) => tag.toLowerCase().includes(needle)),
      );
    }
    list.sort((a, b) => {
      if (sort === "title-asc") return a.title.localeCompare(b.title);
      if (sort === "title-desc") return b.title.localeCompare(a.title);
      if (sort === "updated") {
        return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
      }
      if (sort === "oldest") {
        return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
      }
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
    return list;
  }, [items, q, status, category, sort]);

  const usedCategories = useMemo(
    () =>
      COURSE_CATEGORIES.filter((c) =>
        items.some((course) => course.category === c.value),
      ),
    [items],
  );

  return (
    <InstructorShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              My Courses
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "course" : "courses"} · limit{" "}
              {courseLimit} · rejected and archived courses don&apos;t use a
              slot
            </p>
          </div>
          {canCreate ? (
            <Button asChild>
              <Link href="/instructor/courses/new">
                <Plus className="h-4 w-4" />
                Create Course
              </Link>
            </Button>
          ) : (
            <Button type="button" disabled title="Course limit reached">
              <Plus className="h-4 w-4" />
              Create Course
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[16rem] max-w-md flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, subtitle, or tag"
              className="pl-11"
            />
          </label>

          <div className="w-[11rem]">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[12rem]">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger aria-label="Filter by category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {usedCategories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-[12rem]">
            <Select
              value={sort}
              onValueChange={(value) => setSort(value as SortKey)}
            >
              <SelectTrigger aria-label="Sort courses">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto inline-flex h-11 items-center gap-1 rounded-full bg-muted p-1">
            <button
              type="button"
              aria-label="Card view"
              aria-pressed={view === "cards"}
              onClick={() => setView("cards")}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold transition-colors",
                view === "cards"
                  ? "bg-background text-brand-navy shadow-sm dark:text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Cards
            </button>
            <button
              type="button"
              aria-label="Table view"
              aria-pressed={view === "table"}
              onClick={() => setView("table")}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold transition-colors",
                view === "table"
                  ? "bg-background text-brand-navy shadow-sm dark:text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Rows3 className="h-4 w-4" />
              Table
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading courses" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : courses.length === 0 ? (
          <div className="card-soft px-5 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">
              {items.length === 0 ? "No courses yet" : "No matches"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length === 0
                ? "Create your first course to open the 9-step builder."
                : "Try a different search or clear the filters."}
            </p>
          </div>
        ) : view === "cards" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const thumb = mediaPublicUrl(course.thumbnailUrl);
              const label = courseStatusLabel(course.status);
              const editable = canEditCourse(course.status);
              const actionLabel = builderActionLabel(course);
              return (
                <article key={course.id} className="card-soft overflow-hidden">
                  <Link
                    href={`/instructor/courses/${course.id}`}
                    className="relative block aspect-[16/10] bg-muted"
                  >
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-brand-navy dark:text-brand-lime">
                        {course.title}
                      </div>
                    )}
                  </Link>
                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/instructor/courses/${course.id}`}
                        className="font-bold text-foreground hover:underline"
                      >
                        {course.title}
                      </Link>
                      <Badge variant={courseStatusBadgeVariant(course.status)}>
                        {label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {course.category ? (
                        <Badge variant="outline">
                          {courseCategoryLabel(course.category)}
                        </Badge>
                      ) : null}
                      <Badge variant="outline">
                        {course.isFree || course.priceCents === 0
                          ? "Free"
                          : formatMoney(course.priceCents, course.currency)}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {course.students ?? 0} students · {course.lessons ?? 0}{" "}
                      lessons
                    </p>

                    {course.status !== "published" &&
                    course.status !== "pending_review" ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Builder progress</span>
                          <span>{builderPercent(course)}%</span>
                        </div>
                        <Progress value={builderPercent(course)} />
                      </div>
                    ) : null}

                    {course.status === "published" ? (
                      <p className="text-xs text-muted-foreground">
                        You can update lessons anytime, then submit for review.
                      </p>
                    ) : null}

                    {course.rejectionReason ? (
                      <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-800 dark:bg-red-950 dark:text-red-200">
                        {course.rejectionReason}
                      </p>
                    ) : null}

                    <div className="flex items-center justify-between gap-3 pt-1">
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
                        asChild
                        size="icon"
                        variant={editable ? "default" : "outline"}
                        className="h-9 w-9"
                        title={
                          course.status === "pending_review"
                            ? "View builder (read-only)"
                            : course.status === "archived"
                              ? "Open builder (read-only)"
                              : `${actionLabel} in builder`
                        }
                      >
                        <Link
                          href={`/instructor/courses/${course.id}/builder`}
                          aria-label={
                            course.status === "pending_review"
                              ? `View builder for ${course.title}`
                              : `${actionLabel} ${course.title}`
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <ScrollTable minWidthClassName="min-w-[60rem]">
            <ScrollTableHead>
              <tr>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Students</th>
                <th className="px-5 py-3 font-medium">Lessons</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <StickyActionHead />
              </tr>
            </ScrollTableHead>
            <tbody>
              {courses.length === 0 ? (
                <ScrollTableEmpty colSpan={8} />
              ) : (
                courses.map((course) => {
                  const editable = canEditCourse(course.status);
                  const actionLabel = builderActionLabel(course);
                  return (
                    <tr
                      key={course.id}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/instructor/courses/${course.id}`}
                          className="font-semibold text-foreground hover:underline"
                        >
                          {course.title}
                        </Link>
                        {course.subtitle ? (
                          <p className="mt-0.5 max-w-[22rem] truncate text-xs text-muted-foreground">
                            {course.subtitle}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {courseCategoryLabel(course.category) || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={courseStatusBadgeVariant(course.status)}
                        >
                          {courseStatusLabel(course.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {course.isFree || course.priceCents === 0
                          ? "Free"
                          : formatMoney(course.priceCents, course.currency)}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {course.students ?? 0}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {course.lessons ?? 0}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={builderPercent(course)}
                            className="w-24"
                          />
                          <span className="text-xs text-muted-foreground">
                            {builderPercent(course)}%
                          </span>
                        </div>
                      </td>
                      <StickyActionCell>
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/instructor/courses/${course.id}`}>
                              View
                            </Link>
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            variant={editable ? "default" : "outline"}
                            title={
                              course.status === "pending_review"
                                ? "View builder (read-only)"
                                : course.status === "archived"
                                  ? "Open builder (read-only)"
                                  : `${actionLabel} in builder`
                            }
                          >
                            <Link
                              href={`/instructor/courses/${course.id}/builder`}
                              aria-label={
                                course.status === "pending_review"
                                  ? `View builder for ${course.title}`
                                  : `${actionLabel} ${course.title}`
                              }
                            >
                              <Pencil className="h-4 w-4" />
                              {course.status === "pending_review"
                                ? "Builder"
                                : actionLabel}
                            </Link>
                          </Button>
                        </div>
                      </StickyActionCell>
                    </tr>
                  );
                })
              )}
            </tbody>
          </ScrollTable>
        )}
      </div>
    </InstructorShell>
  );
}
