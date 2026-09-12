"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  AdminDownloadMenu,
  formatAdminDate,
} from "@/components/admin/AdminDownloadMenu";
import {
  AdminShell,
  adminStatusTone,
  formatAdminStatusLabel,
} from "@/components/admin/AdminShell";
import { Input } from "@/components/ui/input";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { Spinner } from "@/components/ui/spinner";
import { adminCoursesRequest, getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

type CourseRow = {
  id: string;
  title: string;
  instructor: string;
  status: string;
  updatedAt?: string;
  publishedAt?: string;
};

type Filter = "all" | "pending" | "published";

export default function AdminCoursesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [stats, setStats] = useState({ pending: 0, published: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminCoursesRequest({
        q: q.trim() || undefined,
        status: filter === "all" ? undefined : filter,
      });
      setStats({
        pending: Number(res.stats?.pending ?? 0),
        published: Number(res.stats?.published ?? 0),
      });
      setRows(
        (res.items ?? []).map((c) => ({
          id: String(c.id ?? ""),
          title: String(c.title ?? "—"),
          instructor: String(c.instructor ?? "—"),
          status: String(c.status ?? "—"),
          updatedAt: c.updatedAt ? String(c.updatedAt) : undefined,
          publishedAt: c.publishedAt ? String(c.publishedAt) : undefined,
        })),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load courses."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const downloadRows = useMemo(
    () =>
      rows.map((c) => ({
        Title: c.title,
        Instructor: c.instructor,
        Status: formatAdminStatusLabel(c.status),
        Updated: formatAdminDate(c.updatedAt || c.publishedAt),
      })),
    [rows],
  );

  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Published", value: "published" },
  ];

  return (
    <AdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Courses
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Platform courses pending review and already published.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search courses…"
                className="pl-9"
              />
            </div>
            <AdminDownloadMenu
              title="Courses"
              subtitle={`${rows.length} courses`}
              fileName="admin-courses"
              columns={[
                { key: "Title", label: "Title" },
                { key: "Instructor", label: "Instructor" },
                { key: "Status", label: "Status" },
                { key: "Updated", label: "Updated" },
              ]}
              rows={downloadRows}
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card-soft px-5 py-4">
            <p className="text-xs font-medium text-muted-foreground">Pending</p>
            <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
              {stats.pending}
            </p>
          </div>
          <div className="card-soft px-5 py-4">
            <p className="text-xs font-medium text-muted-foreground">
              Published
            </p>
            <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
              {stats.published}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold",
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {f.label}
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
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Updated</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-16">
                  <div className="flex justify-center">
                    <Spinner label="Loading courses" />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <ScrollTableEmpty colSpan={4} message="No courses found" />
            ) : (
              rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/70 hover:bg-accent/40"
                >
                  <td className="px-5 py-4 font-semibold">{c.title}</td>
                  <td className="px-5 py-4">{c.instructor}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        adminStatusTone(c.status),
                      )}
                    >
                      {formatAdminStatusLabel(c.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatAdminDate(c.updatedAt || c.publishedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </ScrollTable>
      </div>
    </AdminShell>
  );
}
