"use client";

import Link from "next/link";
import {
  AdminShell,
  adminStatusTone,
} from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  ScrollTable,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import { demoAdminInstructors } from "@/lib/admin-demo-data";
import { cn } from "@/lib/utils";

export default function AdminInstructorsPage() {
  return (
    <AdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Instructors
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View profiles only — approve/create is Super Admin or Academic
          </p>
        </div>

        <ScrollTable
          minWidthClassName="min-w-[52rem]"
          maxHeightClassName="max-h-[32rem]"
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Courses</th>
              <th className="px-5 py-3 font-medium">Students</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoAdminInstructors.map((i) => (
              <tr
                key={i.id}
                className="border-b border-border/70 hover:bg-accent/40"
              >
                <td className="px-5 py-4 font-semibold">{i.name}</td>
                <td className="px-5 py-4">{i.email}</td>
                <td className="px-5 py-4 text-muted-foreground">{i.phone}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      adminStatusTone(i.status),
                    )}
                  >
                    {i.status}
                  </span>
                </td>
                <td className="px-5 py-4">{i.totalCourses}</td>
                <td className="px-5 py-4">{i.totalStudents}</td>
                <StickyActionCell>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/instructors/${i.id}`}>View</Link>
                  </Button>
                </StickyActionCell>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </AdminShell>
  );
}
