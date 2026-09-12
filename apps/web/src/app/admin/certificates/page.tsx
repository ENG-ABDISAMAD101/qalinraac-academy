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
  adminCertificatesRequest,
  getApiErrorMessage,
  mediaPublicUrl,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

type CertRow = {
  id: string;
  status: string;
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  courseTitle: string;
  requestedAt?: string;
};

export default function AdminCertificatesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminCertificatesRequest({
        q: q.trim() || undefined,
      });
      setRows(
        (res.items ?? []).map((c) => {
          const student = (c.student ?? {}) as Record<string, unknown>;
          const course = (c.course ?? {}) as Record<string, unknown>;
          return {
            id: String(c.id ?? ""),
            status: String(c.status ?? "pending"),
            studentName: String(student.name ?? c.recipientName ?? "—"),
            studentEmail: String(student.email ?? "—"),
            studentAvatar: student.avatarUrl
              ? String(student.avatarUrl)
              : undefined,
            courseTitle: String(course.title ?? "—"),
            requestedAt: c.requestedAt ? String(c.requestedAt) : undefined,
          };
        }),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load certificates."));
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
      rows.map((c) => ({
        Student: c.studentName,
        Email: c.studentEmail,
        Course: c.courseTitle,
        Status: formatAdminStatusLabel(c.status),
        Requested: formatAdminDate(c.requestedAt),
      })),
    [rows],
  );

  return (
    <AdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Certificates
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Certificate requests from students
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search student or course…"
                className="pl-9"
              />
            </div>
            <AdminDownloadMenu
              title="Certificates"
              subtitle={`${rows.length} requests`}
              fileName="admin-certificates"
              columns={[
                { key: "Student", label: "Student" },
                { key: "Email", label: "Email" },
                { key: "Course", label: "Course" },
                { key: "Status", label: "Status" },
                { key: "Requested", label: "Requested" },
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
              {loading ? "Loading…" : `${rows.length} requests`}
            </p>
          }
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Course</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Requested</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-16">
                  <div className="flex justify-center">
                    <Spinner label="Loading certificates" />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <ScrollTableEmpty
                colSpan={5}
                message="No certificate requests yet"
              />
            ) : (
              rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/70 hover:bg-accent/40"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage
                          src={mediaPublicUrl(c.studentAvatar)}
                          alt={c.studentName}
                        />
                        <AvatarFallback className="text-xs font-bold text-primary">
                          {initialsFromName(c.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold">{c.studentName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.studentEmail}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">{c.courseTitle}</td>
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
                    {formatAdminDate(c.requestedAt)}
                  </td>
                  <StickyActionCell>
                    <Button asChild size="icon" variant="outline" title="View">
                      <Link href={`/admin/certificates/${c.id}`}>
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
