"use client";

import {
  SuperAdminShell,
  saStatusTone,
} from "@/components/super-admin/SuperAdminShell";
import {
  ScrollTable,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { demoSaStudents } from "@/lib/super-admin-demo-data";
import { cn } from "@/lib/utils";

export default function SuperAdminStudentsPage() {
  return (
    <SuperAdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Students
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Global student directory — promote to Instructor via Users after
            agreement
          </p>
        </div>
        <ScrollTable minWidthClassName="min-w-[48rem]">
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Courses</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Registered</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoSaStudents.map((s) => (
              <tr key={s.id} className="border-b border-border/70">
                <td className="px-5 py-4 font-semibold">{s.name}</td>
                <td className="px-5 py-4">{s.email}</td>
                <td className="px-5 py-4 text-muted-foreground">{s.phone}</td>
                <td className="px-5 py-4">{s.courses}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      saStatusTone(s.status),
                    )}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {s.registeredAt}
                </td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </SuperAdminShell>
  );
}
