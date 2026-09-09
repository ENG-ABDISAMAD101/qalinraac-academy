"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  AcademicShell,
  academicStatusTone,
} from "@/components/academic/AcademicShell";
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
import {
  academicActivationsRequest,
  academicCreateActivationRequest,
  academicPublishedCoursesRequest,
  academicSearchStudentsRequest,
  getApiErrorMessage,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
] as const;

type StudentOption = { id: string; name: string; email: string };
type CourseOption = {
  id: string;
  title: string;
  priceCents: number;
  currency: string;
};
type ActivationRow = {
  id: string;
  student: string;
  course: string;
  price?: number;
  priceCents?: number;
  progress?: number;
  activationDate?: string;
  status: string;
};

function activationStatusLabel(status: string) {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
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

export default function AcademicActivationsPage() {
  const [studentQuery, setStudentQuery] = useState("");
  const [studentHits, setStudentHits] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState("");
  const [publishedCourses, setPublishedCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]["value"]>("all");
  const [rows, setRows] = useState<ActivationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRows = useCallback(async (status: string) => {
    setLoading(true);
    setError("");
    try {
      const data = (await academicActivationsRequest(
        status === "all" ? undefined : status,
      )) as ActivationRow[];
      setRows(data ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load activations."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows(statusFilter);
  }, [loadRows, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const courses = await academicPublishedCoursesRequest();
        if (cancelled) return;
        setPublishedCourses(courses);
        setCourseId((prev) => {
          if (prev || !courses[0]) return prev;
          setPrice((courses[0].priceCents / 100).toFixed(2));
          return courses[0].id;
        });
      } catch {
        if (!cancelled) setPublishedCourses([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (studentQuery.trim().length < 2) {
      setStudentHits([]);
      return;
    }
    const t = setTimeout(() => {
      void (async () => {
        try {
          const hits = await academicSearchStudentsRequest(studentQuery.trim());
          setStudentHits(hits);
        } catch {
          setStudentHits([]);
        }
      })();
    }, 300);
    return () => clearTimeout(t);
  }, [studentQuery]);

  const filteredRows = useMemo(() => {
    if (!q.trim()) return rows;
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (a) =>
        a.student.toLowerCase().includes(needle) ||
        a.course.toLowerCase().includes(needle),
    );
  }, [q, rows]);

  const selectedStudent = studentHits.find((s) => s.id === studentId);
  const filterLabel =
    STATUS_FILTERS.find((f) => f.value === statusFilter)?.label ?? "All";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormMessage("");
    setFormError("");
    if (!studentId) {
      setFormError("Search and select an existing student.");
      return;
    }
    if (!courseId) {
      setFormError("Select a published course.");
      return;
    }
    const dollars = Number(price);
    if (!Number.isFinite(dollars) || dollars < 0) {
      setFormError("Enter a valid price.");
      return;
    }
    setSubmitting(true);
    try {
      await academicCreateActivationRequest({
        studentId,
        courseId,
        priceCents: Math.round(dollars * 100),
        currency: "USD",
      });
      setFormMessage("Activation request submitted for Super Admin review.");
      setStudentQuery("");
      setStudentId("");
      setStudentHits([]);
      await loadRows(statusFilter);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not create activation."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AcademicShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Student Activations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Activate courses for existing students only · Super Admin gives final
            approval
          </p>
        </div>

        <form onSubmit={onSubmit} className="card-soft max-w-2xl space-y-4 p-6">
          <h2 className="text-lg font-bold">New activation request</h2>
          <label className="block text-sm font-medium">
            Search existing student
            <Input
              value={studentQuery}
              onChange={(e) => {
                setStudentQuery(e.target.value);
                setStudentId("");
              }}
              placeholder="Type at least 2 characters…"
              className="mt-2 h-11"
            />
          </label>
          {studentHits.length > 0 ? (
            <ul className="max-h-40 overflow-y-auto rounded-2xl border border-border">
              {studentHits.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentId(s.id);
                      setStudentQuery(`${s.name} · ${s.email}`);
                      setStudentHits([]);
                    }}
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-sm hover:bg-accent",
                      studentId === s.id && "bg-brand-lime-soft/50",
                    )}
                  >
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-muted-foreground"> · {s.email}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {selectedStudent || studentId ? (
            <p className="text-xs text-muted-foreground">
              Selected student ID: {studentId}
            </p>
          ) : null}
          <label className="block text-sm font-medium">
            Select published course
            <select
              value={courseId}
              onChange={(e) => {
                const next = e.target.value;
                setCourseId(next);
                const course = publishedCourses.find((c) => c.id === next);
                if (course) setPrice((course.priceCents / 100).toFixed(2));
              }}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
            >
              {publishedCourses.length === 0 ? (
                <option value="">No published courses</option>
              ) : (
                publishedCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))
              )}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Set price (USD)
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Spinner className="sm on-primary" label="Submitting" />
            ) : null}
            Submit Activation Request
          </Button>
          {formError ? (
            <p className="text-sm text-destructive">{formError}</p>
          ) : null}
          {formMessage ? (
            <p className="text-sm text-brand-navy dark:text-brand-lime">
              {formMessage}
            </p>
          ) : null}
        </form>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="relative min-w-[220px] max-w-md flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search student or course…"
                className="h-11 border-0 bg-background pl-11 shadow-sm"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-xs font-semibold transition",
                    statusFilter === f.value
                      ? "bg-brand-navy text-white dark:bg-brand-lime dark:text-brand-navy"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="flex min-h-[10rem] items-center justify-center">
              <Spinner label="Loading activations" />
            </div>
          ) : (
            <ScrollTable
              minWidthClassName="min-w-[58rem]"
              toolbar={
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-brand-navy dark:text-foreground">
                    Activation report
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {filteredRows.length} result
                    {filteredRows.length === 1 ? "" : "s"}
                    {statusFilter !== "all" ? ` · ${filterLabel}` : ""}
                  </p>
                </div>
              }
            >
              <ScrollTableHead>
                <tr>
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">Activation date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <StickyActionHead />
                </tr>
              </ScrollTableHead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <ScrollTableEmpty
                    colSpan={7}
                    message="No activations match this filter or search."
                  />
                ) : (
                  filteredRows.map((a) => {
                    const label = activationStatusLabel(a.status);
                    const dollars =
                      typeof a.price === "number"
                        ? a.price
                        : typeof a.priceCents === "number"
                          ? a.priceCents / 100
                          : 0;
                    const progress = a.progress ?? 0;
                    return (
                      <tr
                        key={a.id}
                        className="border-b border-border/70 hover:bg-accent/40"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          {a.student}
                        </td>
                        <td className="max-w-[16rem] px-5 py-4">
                          <span className="line-clamp-2">{a.course}</span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          ${dollars.toFixed(2)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex min-w-[5.5rem] items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-brand-lime"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs">{progress}%</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                          {formatDate(a.activationDate)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={cn(
                              "inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold",
                              academicStatusTone(label),
                            )}
                          >
                            {label}
                          </span>
                        </td>
                        <StickyActionCell>
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/academic/activations/${a.id}`}>
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
      </div>
    </AcademicShell>
  );
}
