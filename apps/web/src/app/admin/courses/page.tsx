"use client";

import { useMemo, useState } from "react";
import {
  AdminShell,
  adminStatusTone,
} from "@/components/admin/AdminShell";
import {
  ScrollTable,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import {
  demoAdminCourses,
  type AdminCourseStatus,
} from "@/lib/admin-demo-data";
import { cn } from "@/lib/utils";

const FILTERS: Array<"All" | AdminCourseStatus> = [
  "All",
  "Published",
  "Pending",
  "Rejected",
  "Archived",
];

export default function AdminCoursesPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const rows = useMemo(() => {
    if (filter === "All") return demoAdminCourses;
    return demoAdminCourses.filter((c) => c.status === filter);
  }, [filter]);

  return (
    <AdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Courses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View only — Admin cannot approve, reject, edit, or delete courses
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <ScrollTable
          minWidthClassName="min-w-[48rem]"
          maxHeightClassName="max-h-[32rem]"
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Course Title</th>
              <th className="px-5 py-3 font-medium">Instructor</th>
              <th className="px-5 py-3 font-medium">Students</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created Date</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border/70 hover:bg-accent/40"
              >
                <td className="px-5 py-4 font-semibold">{c.title}</td>
                <td className="px-5 py-4">{c.instructor}</td>
                <td className="px-5 py-4">{c.students}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      adminStatusTone(c.status),
                    )}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {c.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </AdminShell>
  );
}
