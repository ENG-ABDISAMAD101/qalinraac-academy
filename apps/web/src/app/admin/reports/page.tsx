"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminShell } from "@/components/admin/AdminShell";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { adminReportsRequest, getApiErrorMessage } from "@/lib/api";

const COLORS = ["#111827", "#6B7280", "#9CA3AF", "#E5E7EB"];

type Summary = {
  students: number;
  instructors: number;
  publishedCourses: number;
  pendingCourses: number;
  openTickets: number;
  resolvedTickets: number;
  pendingCertificates: number;
  issuedCertificates: number;
  totalUsers: number;
};

type ChartPoint = { label: string; enrollments: number; tickets: number };
type Slice = { name: string; value: number };

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [composition, setComposition] = useState<Slice[]>([]);
  const [courseStatus, setCourseStatus] = useState<Slice[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await adminReportsRequest();
        if (cancelled) return;
        const s = (res.summary ?? {}) as Record<string, unknown>;
        setSummary({
          students: Number(s.students ?? 0),
          instructors: Number(s.instructors ?? 0),
          publishedCourses: Number(s.publishedCourses ?? 0),
          pendingCourses: Number(s.pendingCourses ?? 0),
          openTickets: Number(s.openTickets ?? 0),
          resolvedTickets: Number(s.resolvedTickets ?? 0),
          pendingCertificates: Number(s.pendingCertificates ?? 0),
          issuedCertificates: Number(s.issuedCertificates ?? 0),
          totalUsers: Number(s.totalUsers ?? 0),
        });
        setChart(
          Array.isArray(res.chart)
            ? (res.chart as Record<string, unknown>[]).map((c) => ({
                label: String(c.label ?? ""),
                enrollments: Number(c.enrollments ?? 0),
                tickets: Number(c.tickets ?? 0),
              }))
            : [],
        );
        setComposition(
          Array.isArray(res.composition)
            ? (res.composition as Record<string, unknown>[]).map((c) => ({
                name: String(c.name ?? ""),
                value: Number(c.value ?? 0),
              }))
            : [],
        );
        setCourseStatus(
          Array.isArray(res.courseStatus)
            ? (res.courseStatus as Record<string, unknown>[]).map((c) => ({
                name: String(c.name ?? ""),
                value: Number(c.value ?? 0),
              }))
            : [],
        );
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load admin reports."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !summary) {
    return (
      <AdminShell>
        <PageLoader label="Loading reports" />
      </AdminShell>
    );
  }

  if (error && !summary) {
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

  const cards = summary
    ? [
        { label: "Total students", value: summary.students },
        { label: "Total instructors", value: summary.instructors },
        { label: "Total users", value: summary.totalUsers },
        { label: "Published courses", value: summary.publishedCourses },
        { label: "Pending courses", value: summary.pendingCourses },
        { label: "Open tickets", value: summary.openTickets },
        { label: "Resolved tickets", value: summary.resolvedTickets },
        { label: "Pending certificates", value: summary.pendingCertificates },
        { label: "Issued certificates", value: summary.issuedCertificates },
      ]
    : [];

  return (
    <AdminShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Operational Reports
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Students, instructors, courses, certificates, and support activity.
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
          {cards.map((c) => (
            <div key={c.label} className="card-soft px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
                {c.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="card-soft p-5">
            <h2 className="mb-4 text-base font-bold">
              Enrollments & tickets (6 months)
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="enrollments"
                    name="Enrollments"
                    fill="#111827"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="tickets"
                    name="Tickets"
                    fill="#6B7280"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card-soft p-5">
            <h2 className="mb-4 text-base font-bold">Users composition</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={composition}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {composition.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card-soft p-5 xl:col-span-2">
            <h2 className="mb-4 text-base font-bold">Course status</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseStatus} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" name="Courses" radius={[0, 6, 6, 0]}>
                    {courseStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
