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
import { Badge } from "@/components/ui/badge";
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
import { FilterMenu } from "@/components/ui/filter-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  COURSE_CATEGORIES,
  courseCategoryLabel,
  formatMoney,
  getApiErrorMessage,
  instructorCoursesRequest,
  instructorOpenCourseEditorRequest,
  mediaPublicUrl,
  type InstructorCourse,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "in_progress", label: "In Progress" },
  { value: "published", label: "Published" },
];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "updated", label: "Recently updated" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
];

type SortKey = (typeof SORTS)[number]["value"];

function instructorLabel(course: InstructorCourse) {
  return courseStatusLabel(course.status, course.displayStatus);
}

function isPublished(course: InstructorCourse) {
  return (
    course.displayStatus === "Published" || course.status === "published"
  );
}

function isInProgress(course: InstructorCourse) {
  return (
    course.displayStatus === "In Progress" ||
    course.status === "in_progress" ||
    course.reviewStatus === "pending_review"
  );
}

function builderPercent(course: InstructorCourse) {
  if (isPublished(course)) return 100;
  return Math.min(
    100,
    Math.round(((course.builderStep ?? 1) / TOTAL_STEPS) * 100),
  );
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
  const [editBusyId, setEditBusyId] = useState<string | null>(null);

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
    if (status === "published") {
      list = list.filter((c) => isPublished(c));
    } else if (status === "in_progress") {
      list = list.filter((c) => isInProgress(c) || c.activeRevision?.displayStatus === "In Progress");
    } else if (status === "draft") {
      list = list.filter(
        (c) =>
          !isPublished(c) &&
          !isInProgress(c) &&
          c.activeRevision?.displayStatus !== "In Progress",
      );
    }
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

  async function onEdit(course: InstructorCourse) {
    if (isPublished(course)) {
      setEditBusyId(course.id);
      try {
        const draft = await instructorOpenCourseEditorRequest(course.id);
        window.location.href = `/instructor/courses/${draft.id}/builder`;
      } catch (err) {
        setError(getApiErrorMessage(err, "Could not open course editor."));
        setEditBusyId(null);
      }
      return;
    }
    window.location.href = `/instructor/courses/${course.id}/builder`;
  }

  return (
    <InstructorShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              My Courses
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "course" : "courses"} · limit{" "}
              {courseLimit}
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
            <FilterMenu
              aria-label="Filter by status"
              value={status}
              onValueChange={setStatus}
              options={STATUS_FILTERS}
            />
          </div>

          <div className="w-[12rem]">
            <FilterMenu
              aria-label="Filter by category"
              value={category}
              onValueChange={setCategory}
              options={[
                { value: "all", label: "All categories" },
                ...usedCategories,
              ]}
            />
          </div>

          <div className="w-[12rem]">
            <FilterMenu
              aria-label="Sort courses"
              value={sort}
              onValueChange={(value) => setSort(value as SortKey)}
              options={SORTS}
            />
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
                  ? "bg-background text-primary shadow-sm dark:text-foreground"
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
                  ? "bg-background text-primary shadow-sm dark:text-foreground"
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
                ? "Create your first course to open the builder."
                : "Try a different search or clear the filters."}
            </p>
          </div>
        ) : view === "cards" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const thumb = mediaPublicUrl(course.thumbnailUrl);
              const label = instructorLabel(course);
              const published = isPublished(course);
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
                      <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-primary">
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
                      <Badge variant={published ? "default" : "muted"}>
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

                    {!published ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Builder progress</span>
                          <span>{builderPercent(course)}%</span>
                        </div>
                        <Progress value={builderPercent(course)} />
                      </div>
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
                        type="button"
                        size="icon"
                        className="h-9 w-9"
                        title="Edit in builder"
                        disabled={editBusyId === course.id}
                        onClick={() => void onEdit(course)}
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
                  const label = instructorLabel(course);
                  const published = isPublished(course);
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
                        <Badge variant={published ? "default" : "muted"}>
                          {label}
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
                            type="button"
                            size="sm"
                            disabled={editBusyId === course.id}
                            onClick={() => void onEdit(course)}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
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
