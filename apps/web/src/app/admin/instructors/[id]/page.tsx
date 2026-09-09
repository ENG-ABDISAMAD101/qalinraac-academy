"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AdminShell,
  adminStatusTone,
} from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { demoAdminInstructors } from "@/lib/admin-demo-data";
import { cn } from "@/lib/utils";

export default function AdminInstructorDetailPage() {
  const params = useParams<{ id: string }>();
  const item =
    demoAdminInstructors.find((i) => i.id === params.id) ??
    demoAdminInstructors[0];

  return (
    <AdminShell>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/instructors">← Instructors</Link>
        </Button>
        <div className="card-soft space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-brand-navy dark:text-foreground">
              {item.name}
            </h1>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                adminStatusTone(item.status),
              )}
            >
              {item.status}
            </span>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-semibold">{item.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-semibold">{item.phone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Total courses</dt>
              <dd className="font-semibold">{item.totalCourses}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Total students</dt>
              <dd className="font-semibold">{item.totalStudents}</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Admin cannot approve, reject, or create instructors.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
