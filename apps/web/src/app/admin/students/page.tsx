"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import {
  AdminDownloadMenu,
  formatAdminDate,
} from "@/components/admin/AdminDownloadMenu";
import {
  AdminShell,
  adminStatusTone,
  formatAdminStatusLabel,
} from "@/components/admin/AdminShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import { Spinner } from "@/components/ui/spinner";
import {
  adminStudentsRequest,
  getApiErrorMessage,
  mediaPublicUrl,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  courses: number;
  status: string;
  avatarUrl?: string;
  registeredAt?: string;
};

export default function AdminStudentsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminStudentsRequest(q.trim() || undefined);
      setRows(
        (res.items ?? []).map((s) => ({
          id: String(s.id ?? ""),
          name: String(s.name ?? "—"),
          email: String(s.email ?? "—"),
          phone: String(s.phone ?? "—"),
          courses: Number(s.courses ?? 0),
          status: String(s.status ?? "Active"),
          avatarUrl: s.avatarUrl ? String(s.avatarUrl) : undefined,
          registeredAt: s.registeredAt ? String(s.registeredAt) : undefined,
        })),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load students."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const downloadRows = useMemo(
    () =>
      rows.map((s) => ({
        Student: s.name,
        Email: s.email,
        Phone: s.phone,
        Courses: s.courses,
        Status: s.status,
        Registered: formatAdminDate(s.registeredAt),
      })),
    [rows],
  );

  return (
    <AdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Students
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Registered students, course enrollments, and account status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, email, or phone…"
                className="pl-9"
              />
            </div>
            <AdminDownloadMenu
              title="Students"
              subtitle={`${rows.length} students`}
              fileName="admin-students"
              columns={[
                { key: "Student", label: "Student" },
                { key: "Email", label: "Email" },
                { key: "Phone", label: "Phone" },
                { key: "Courses", label: "Courses" },
                { key: "Status", label: "Status" },
                { key: "Registered", label: "Registered" },
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

        <ScrollTable
          minWidthClassName="min-w-[56rem]"
          maxHeightClassName="max-h-[32rem]"
          toolbar={
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : `${rows.length} students`}
            </p>
          }
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Courses</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Registered</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-16">
                  <div className="flex justify-center">
                    <Spinner label="Loading students" />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <ScrollTableEmpty colSpan={7} message="No students found" />
            ) : (
              rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border/70 hover:bg-accent/40"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage
                          src={mediaPublicUrl(s.avatarUrl)}
                          alt={s.name}
                        />
                        <AvatarFallback className="text-xs font-bold text-primary">
                          {initialsFromName(s.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">{s.email}</td>
                  <td className="px-5 py-4 text-muted-foreground">{s.phone}</td>
                  <td className="px-5 py-4">{s.courses}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        adminStatusTone(s.status),
                      )}
                    >
                      {formatAdminStatusLabel(s.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatAdminDate(s.registeredAt)}
                  </td>
                  <StickyActionCell>
                    <Button asChild size="icon" variant="outline" title="View">
                      <Link href={`/admin/students/${s.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </StickyActionCell>
                </tr>
              ))
            )}
          </tbody>
        </ScrollTable>
      </div>
    </AdminShell>
  );
}
