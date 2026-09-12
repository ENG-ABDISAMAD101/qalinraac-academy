"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import {
  AdminShell,
  adminPriorityTone,
  adminStatusTone,
  formatAdminDate,
  formatAdminStatusLabel,
} from "@/components/admin/AdminShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import {
  adminDashboardRequest,
  getApiErrorMessage,
  mediaPublicUrl,
  type AdminDashboardData,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

type TicketRow = {
  id: string;
  subject: string;
  priority: string;
  status: string;
  user: string;
  role: string;
  updatedAt?: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatarUrl?: string;
  registeredAt?: string;
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await adminDashboardRequest();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load admin dashboard."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !data) {
    return (
      <AdminShell>
        <PageLoader label="Loading dashboard" />
      </AdminShell>
    );
  }

  if (error && !data) {
    return (
      <AdminShell>
        <div className="px-4 py-10 sm:px-6 lg:px-8">
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        </div>
      </AdminShell>
    );
  }

  const stats = data?.stats;
  const cards = [
    { label: "Total Students", value: stats?.totalStudents ?? 0 },
    { label: "Total Instructors", value: stats?.totalInstructors ?? 0 },
    { label: "Total Courses", value: stats?.totalCourses ?? 0 },
    { label: "Active Courses", value: stats?.activeCourses ?? 0 },
    { label: "Open Support Tickets", value: stats?.openSupportTickets ?? 0 },
    { label: "Total Users", value: stats?.totalUsers ?? 0 },
  ];

  const tickets: TicketRow[] = (data?.recentTickets ?? []).map((t) => ({
    id: String(t.id ?? ""),
    subject: String(t.subject ?? "—"),
    priority: String(t.priority ?? "medium"),
    status: String(t.status ?? "open"),
    user: String(t.user ?? "—"),
    role: String(t.role ?? "—"),
    updatedAt: t.updatedAt ? String(t.updatedAt) : undefined,
  }));

  const users: UserRow[] = (data?.recentUsers ?? []).map((u) => ({
    id: String(u.id ?? ""),
    name: String(u.name ?? "—"),
    email: String(u.email ?? "—"),
    role: String(u.role ?? "—"),
    status: String(u.status ?? "Active"),
    avatarUrl: u.avatarUrl ? String(u.avatarUrl) : undefined,
    registeredAt: u.registeredAt ? String(u.registeredAt) : undefined,
  }));

  return (
    <AdminShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Operations Center
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Overview of students, instructors, courses, and support activity.
            </p>
          </div>
          {loading ? <Spinner className="sm" label="Refreshing" /> : null}
        </div>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((s) => (
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
              <Link href="/admin/students">View Students</Link>
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
              <th className="px-5 py-3 font-medium">Updated</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {tickets.length === 0 ? (
              <ScrollTableEmpty colSpan={7} message="No open tickets" />
            ) : (
              tickets.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border/70 hover:bg-accent/40"
                >
                  <td className="whitespace-nowrap px-5 py-4 font-semibold">
                    {t.user}
                  </td>
                  <td className="px-5 py-4">{t.role}</td>
                  <td className="max-w-[14rem] truncate px-5 py-4">
                    {t.subject}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        adminPriorityTone(t.priority),
                      )}
                    >
                      {formatAdminStatusLabel(t.priority)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        adminStatusTone(t.status),
                      )}
                    >
                      {formatAdminStatusLabel(t.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatAdminDate(t.updatedAt)}
                  </td>
                  <StickyActionCell>
                    <Button asChild size="icon" variant="outline" title="View">
                      <Link href={`/admin/support/${t.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </StickyActionCell>
                </tr>
              ))
            )}
          </tbody>
        </ScrollTable>

        <ScrollTable
          minWidthClassName="min-w-[40rem]"
          maxHeightClassName="max-h-[18rem]"
          toolbar={<p className="text-sm font-semibold">Recent Users</p>}
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Registered</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {users.length === 0 ? (
              <ScrollTableEmpty colSpan={5} message="No recent users" />
            ) : (
              users.map((u) => {
                const href =
                  u.role === "Instructor"
                    ? `/admin/instructors/${u.id}`
                    : `/admin/students/${u.id}`;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-border/70 hover:bg-accent/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage
                            src={mediaPublicUrl(u.avatarUrl)}
                            alt={u.name}
                          />
                          <AvatarFallback className="text-xs font-bold text-primary">
                            {initialsFromName(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{u.role}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold",
                          adminStatusTone(u.status),
                        )}
                      >
                        {formatAdminStatusLabel(u.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatAdminDate(u.registeredAt)}
                    </td>
                    <StickyActionCell>
                      <Button asChild size="icon" variant="outline" title="View">
                        <Link href={href}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </StickyActionCell>
                  </tr>
                );
              })
            )}
          </tbody>
        </ScrollTable>
      </div>
    </AdminShell>
  );
}
