"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  AdminShell,
  adminStatusTone,
} from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  demoAdminStudents,
  type AdminStudentStatus,
} from "@/lib/admin-demo-data";
import { cn } from "@/lib/utils";

export default function AdminStudentDetailPage() {
  const params = useParams<{ id: string }>();
  const base =
    demoAdminStudents.find((s) => s.id === params.id) ?? demoAdminStudents[0];
  const [status, setStatus] = useState<AdminStudentStatus>(base.status);

  return (
    <AdminShell>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/students">← Students</Link>
        </Button>
        <div className="card-soft space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-brand-navy dark:text-foreground">
              {base.name}
            </h1>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                adminStatusTone(status),
              )}
            >
              {status}
            </span>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-semibold">{base.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-semibold">{base.phone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Registered</dt>
              <dd className="font-semibold">{base.registeredAt}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-semibold">Student</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            {status === "Active" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStatus("Disabled")}
              >
                Disable account
              </Button>
            ) : (
              <Button
                type="button"
                className="bg-brand-lime text-brand-navy hover:bg-brand-lime/90"
                onClick={() => setStatus("Active")}
              >
                Enable account
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Admin cannot delete student accounts.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
