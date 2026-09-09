"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SuperAdminShell, money } from "@/components/super-admin/SuperAdminShell";
import { Button } from "@/components/ui/button";
import {
  demoSuperAdminChart,
  demoSuperAdminStats,
  demoSystemActivity,
} from "@/lib/super-admin-demo-data";

export default function SuperAdminDashboardPage() {
  const stats = [
    { label: "Total Users", value: demoSuperAdminStats.totalUsers },
    { label: "Total Students", value: demoSuperAdminStats.totalStudents },
    { label: "Total Instructors", value: demoSuperAdminStats.totalInstructors },
    {
      label: "Total Academic Staff",
      value: demoSuperAdminStats.totalAcademicStaff,
    },
    {
      label: "Total Finance Staff",
      value: demoSuperAdminStats.totalFinanceStaff,
    },
    {
      label: "Total Research Staff",
      value: demoSuperAdminStats.totalResearchStaff,
    },
    { label: "Total Admins", value: demoSuperAdminStats.totalAdmins },
    { label: "Total Courses", value: demoSuperAdminStats.totalCourses },
    { label: "Active Courses", value: demoSuperAdminStats.activeCourses },
    {
      label: "Pending Course Reviews",
      value: demoSuperAdminStats.pendingCourseReviews,
    },
    {
      label: "Pending Student Activations",
      value: demoSuperAdminStats.pendingActivations,
    },
    {
      label: "Pending Certificates",
      value: demoSuperAdminStats.pendingCertificates,
    },
    {
      label: "Total Revenue",
      value: money(demoSuperAdminStats.totalRevenue),
    },
    {
      label: "Total Expenses",
      value: money(demoSuperAdminStats.totalExpenses),
    },
    { label: "Net Profit", value: money(demoSuperAdminStats.netProfit) },
    {
      label: "Pending Withdrawals",
      value: demoSuperAdminStats.pendingWithdrawals,
    },
    {
      label: "Open Support Tickets",
      value: demoSuperAdminStats.openSupportTickets,
    },
  ];

  return (
    <SuperAdminShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              System Control Center
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Global visibility across users, academic, finance, research, and
              platform settings
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/super-admin/users">Manage Users</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/super-admin/settings">System Settings</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/super-admin/audit-logs">Audit Logs</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card-soft px-4 py-3.5">
              <p className="text-[11px] font-medium text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-xl font-bold text-primary dark:text-foreground">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="card-soft p-5">
            <h2 className="mb-4 text-base font-bold">Users growth</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demoSuperAdminChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#111827"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="card-soft p-5">
            <h2 className="mb-4 text-base font-bold">Monthly revenue</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demoSuperAdminChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#6B7280" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className="card-soft overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-bold">Recent system activity</h2>
          </div>
          <ul className="divide-y divide-border/70">
            {demoSystemActivity.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {a.actor}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {a.action}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {a.detail}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{a.time}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SuperAdminShell>
  );
}
