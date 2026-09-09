"use client";

import {
  SuperAdminShell,
  saStatusTone,
} from "@/components/super-admin/SuperAdminShell";
import {
  ScrollTable,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { demoSaCourses } from "@/lib/super-admin-demo-data";
import { cn } from "@/lib/utils";

export default function SuperAdminCoursesPage() {
  return (
    <SuperAdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Courses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform-wide course catalog with status visibility
          </p>
        </div>
        <ScrollTable minWidthClassName="min-w-[48rem]">
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Instructor</th>
              <th className="px-5 py-3 font-medium">Students</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoSaCourses.map((c) => (
              <tr key={c.id} className="border-b border-border/70">
                <td className="px-5 py-4 font-semibold">{c.title}</td>
                <td className="px-5 py-4">{c.instructor}</td>
                <td className="px-5 py-4">{c.students}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      saStatusTone(c.status),
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
    </SuperAdminShell>
  );
}
