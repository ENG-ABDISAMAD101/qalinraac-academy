"use client";

import {
  SuperAdminShell,
  money,
  saStatusTone,
} from "@/components/super-admin/SuperAdminShell";
import {
  ScrollTable,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { demoSaInstructors } from "@/lib/super-admin-demo-data";
import { cn } from "@/lib/utils";

export default function SuperAdminInstructorsPage() {
  return (
    <SuperAdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Instructors
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created by promoting Students after institutional agreement
          </p>
        </div>
        <ScrollTable minWidthClassName="min-w-[52rem]">
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Courses</th>
              <th className="px-5 py-3 font-medium">Students</th>
              <th className="px-5 py-3 font-medium">Earnings</th>
              <th className="px-5 py-3 font-medium">Agreement</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoSaInstructors.map((i) => (
              <tr key={i.id} className="border-b border-border/70">
                <td className="px-5 py-4 font-semibold">{i.name}</td>
                <td className="px-5 py-4">{i.email}</td>
                <td className="px-5 py-4">{i.courses}</td>
                <td className="px-5 py-4">{i.students}</td>
                <td className="px-5 py-4">{money(i.earnings)}</td>
                <td className="px-5 py-4">{i.agreement}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      saStatusTone(i.status),
                    )}
                  >
                    {i.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </SuperAdminShell>
  );
}
