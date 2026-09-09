"use client";

import Link from "next/link";
import {
  AdminShell,
  adminPriorityTone,
  adminStatusTone,
} from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  ScrollTable,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import {
  demoAdmin,
  demoAdminAcademicOverview,
  demoAdminRecentUsers,
  demoAdminStats,
  demoAdminTickets,
} from "@/lib/admin-demo-data";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const stats = [
    { label: "Total Students", value: demoAdminStats.totalStudents },
    { label: "Total Instructors", value: demoAdminStats.totalInstructors },
    { label: "Total Courses", value: demoAdminStats.totalCourses },
    { label: "Active Courses", value: demoAdminStats.activeCourses },
    {
      label: "Open Support Tickets",
      value: demoAdminStats.openSupportTickets,
    },
    { label: "Total Users", value: demoAdminStats.totalUsers },
  ];

  const recentTickets = demoAdminTickets.filter(
    (t) => t.status === "Open" || t.status === "In Progress",
  );

  return (
    <AdminShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Operations Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor platform activity and handle support — no finance or system
            settings
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="card-soft px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-3 text-base font-bold">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/admin/support">Review Tickets</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/students">Manage Students</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/reports">View Reports</Link>
            </Button>
          </div>
        </section>

        <ScrollTable
          minWidthClassName="min-w-[56rem]"
          maxHeightClassName="max-h-[20rem]"
          toolbar={
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Recent Support Tickets</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/support">View all</Link>
              </Button>
            </div>
          }
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Subject</th>
              <th className="px-5 py-3 font-medium">Priority</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {recentTickets.map((t) => (
              <tr
                key={t.id}
                className="border-b border-border/70 hover:bg-accent/40"
              >
                <td className="whitespace-nowrap px-5 py-4 font-semibold">
                  {t.user}
                </td>
                <td className="px-5 py-4">{t.userRole}</td>
                <td className="max-w-[14rem] truncate px-5 py-4">{t.subject}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      adminPriorityTone(t.priority),
                    )}
                  >
                    {t.priority}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      adminStatusTone(t.status),
                    )}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {t.createdAt}
                </td>
                <StickyActionCell>
                  <Button asChild size="sm">
                    <Link href={`/admin/support/${t.id}`}>Review</Link>
                  </Button>
                </StickyActionCell>
              </tr>
            ))}
          </tbody>
        </ScrollTable>

        <section className="card-soft p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold">Academic Overview</h2>
            <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
              {demoAdmin.academicActionsEnabled
                ? "Academic actions enabled"
                : "Monitor only"}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              [
                "Pending Course Reviews",
                demoAdminAcademicOverview.pendingCourseReviews,
              ],
              [
                "Pending Student Activations",
                demoAdminAcademicOverview.pendingActivations,
              ],
              [
                "Pending Certificates",
                demoAdminAcademicOverview.pendingCertificates,
              ],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl bg-muted px-4 py-3">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="mt-1 text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Approve/reject actions require Super Admin academic permission.
          </p>
        </section>

        <ScrollTable
          minWidthClassName="min-w-[40rem]"
          maxHeightClassName="max-h-[18rem]"
          toolbar={<p className="text-sm font-semibold">Recent Users</p>}
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Registration Date</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoAdminRecentUsers.map((u) => (
              <tr
                key={u.id}
                className="border-b border-border/70 hover:bg-accent/40"
              >
                <td className="px-5 py-4 font-semibold">{u.name}</td>
                <td className="px-5 py-4">{u.role}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      adminStatusTone(u.status),
                    )}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {u.registeredAt}
                </td>
                <StickyActionCell>
                  <Button asChild size="sm" variant="outline">
                    <Link href={u.href}>View</Link>
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
