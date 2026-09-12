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
  adminStudentRequest,
  getApiErrorMessage,
  mediaPublicUrl,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

type CourseItem = {
  id: string;
  title: string;
  status: string;
  progressPercent: number;
  enrolledAt?: string;
};

type StudentDetail = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  avatarUrl?: string;
  registeredAt?: string;
  coursesRegistered: number;
  courses: CourseItem[];
};

export default function AdminStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const raw = await adminStudentRequest(id);
      setStudent({
        id: String(raw.id ?? id),
        name: String(raw.name ?? raw.fullName ?? "Student"),
        email: raw.email ? String(raw.email) : undefined,
        phone: raw.phone ? String(raw.phone) : undefined,
        status: String(raw.status ?? "Active"),
        avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : undefined,
        registeredAt: raw.registeredAt
          ? String(raw.registeredAt)
          : undefined,
        coursesRegistered: Number(raw.coursesRegistered ?? 0),
        courses: Array.isArray(raw.courses)
          ? (raw.courses as Record<string, unknown>[]).map((c) => ({
              id: String(c.id ?? ""),
              title: String(c.title ?? "Course"),
              status: String(c.status ?? "—"),
              progressPercent: Number(c.progressPercent ?? 0),
              enrolledAt: c.enrolledAt ? String(c.enrolledAt) : undefined,
            }))
          : [],
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load student."));
      setStudent(null);
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
          <Link href="/admin/students">← Students</Link>
        </Button>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading student" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : student ? (
          <div className="card-soft overflow-hidden">
            <div className="border-b border-border/70 bg-canvas px-6 py-8 dark:bg-muted/30">
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-6">
                <Avatar className="h-28 w-28 border-4 border-white shadow-md ring-1 ring-border">
                  <AvatarImage
                    src={mediaPublicUrl(student.avatarUrl)}
                    alt={student.name}
                  />
                  <AvatarFallback className="text-2xl font-bold text-primary">
                    {initialsFromName(student.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-4 min-w-0 flex-1 sm:mt-2">
                  <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
                      {student.name}
                    </h1>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        adminStatusTone(student.status),
                      )}
                    >
                      {formatAdminStatusLabel(student.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Student profile
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8 p-6 sm:p-8">
              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ["Email", student.email || "—"],
                  ["Phone", student.phone || "—"],
                  ["Registered", formatAdminDate(student.registeredAt)],
                  ["Role", "Student"],
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

              <div>
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <h2 className="text-base font-bold text-primary dark:text-foreground">
                    Courses registered
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {student.coursesRegistered} course
                    {student.coursesRegistered === 1 ? "" : "s"}
                  </p>
                </div>
                {student.courses.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    No course enrollments yet
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {student.courses.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold">{c.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Enrolled {formatAdminDate(c.enrolledAt)} ·{" "}
                            {formatAdminStatusLabel(c.status)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-primary">
                          {c.progressPercent}%
                        </p>
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
