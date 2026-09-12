"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AdminShell,
  adminStatusTone,
  formatAdminDate,
  formatAdminStatusLabel,
} from "@/components/admin/AdminShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  adminInstructorRequest,
  getApiErrorMessage,
  mediaPublicUrl,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

type CourseItem = {
  id: string;
  title: string;
  status: string;
  createdAt?: string;
  publishedAt?: string;
};

type InstructorDetail = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  avatarUrl?: string;
  registeredAt?: string;
  coursesCount: number;
  studentsCount: number;
  courses: CourseItem[];
};

export default function AdminInstructorDetailPage() {
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
      const raw = await adminInstructorRequest(id);
      setInstructor({
        id: String(raw.id ?? id),
        name: String(raw.name ?? raw.fullName ?? "Instructor"),
        email: raw.email ? String(raw.email) : undefined,
        phone: raw.phone ? String(raw.phone) : undefined,
        status: String(raw.status ?? "Active"),
        avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : undefined,
        registeredAt: raw.registeredAt
          ? String(raw.registeredAt)
          : undefined,
        coursesCount: Number(raw.coursesCount ?? 0),
        studentsCount: Number(raw.studentsCount ?? 0),
        courses: Array.isArray(raw.courses)
          ? (raw.courses as Record<string, unknown>[]).map((c) => ({
              id: String(c.id ?? ""),
              title: String(c.title ?? "Course"),
              status: String(c.status ?? "—"),
              createdAt: c.createdAt ? String(c.createdAt) : undefined,
              publishedAt: c.publishedAt ? String(c.publishedAt) : undefined,
            }))
          : [],
      });
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

  return (
    <AdminShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/instructors">← Instructors</Link>
        </Button>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading instructor" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : instructor ? (
          <div className="card-soft overflow-hidden">
            <div className="border-b border-border/70 bg-canvas px-6 py-8 dark:bg-muted/30">
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
                <Avatar className="h-28 w-28 border-4 border-white shadow-md ring-1 ring-border">
                  <AvatarImage
                    src={mediaPublicUrl(instructor.avatarUrl)}
                    alt={instructor.name}
                  />
                  <AvatarFallback className="text-2xl font-bold text-primary">
                    {initialsFromName(instructor.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4 min-w-0 flex-1 sm:mt-2">
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
                      {instructor.name}
                    </h1>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        adminStatusTone(instructor.status),
                      )}
                    >
                      {formatAdminStatusLabel(instructor.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {instructor.email || "—"}
                    {instructor.phone ? ` · ${instructor.phone}` : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8 p-6 sm:p-8">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Email", instructor.email || "—"],
                  ["Phone", instructor.phone || "—"],
                  ["Registered", formatAdminDate(instructor.registeredAt)],
                  ["Role", "Instructor"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-border/70 px-4 py-3"
                  >
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/60 px-4 py-4">
                  <p className="text-xs text-muted-foreground">Courses</p>
                  <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
                    {instructor.coursesCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/60 px-4 py-4">
                  <p className="text-xs text-muted-foreground">Students</p>
                  <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
                    {instructor.studentsCount}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="mb-3 text-base font-bold text-primary dark:text-foreground">
                  Course list
                </h2>
                {instructor.courses.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    No courses yet
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {instructor.courses.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold">{c.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Updated {formatAdminDate(c.publishedAt || c.createdAt)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-bold",
                            adminStatusTone(c.status),
                          )}
                        >
                          {formatAdminStatusLabel(c.status)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
