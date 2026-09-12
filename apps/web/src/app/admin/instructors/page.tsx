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
  adminInstructorsRequest,
  getApiErrorMessage,
  mediaPublicUrl,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

type InstructorRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  courses: number;
  published: number;
  avatarUrl?: string;
  registeredAt?: string;
};

export default function AdminInstructorsPage() {
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<InstructorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminInstructorsRequest(q.trim() || undefined);
      setRows(
        (res.items ?? []).map((i) => ({
          id: String(i.id ?? ""),
          name: String(i.name ?? "—"),
          email: String(i.email ?? "—"),
          phone: String(i.phone ?? "—"),
          status: String(i.status ?? "Active"),
          courses: Number(i.courses ?? 0),
          published: Number(i.published ?? 0),
          avatarUrl: i.avatarUrl ? String(i.avatarUrl) : undefined,
          registeredAt: i.registeredAt ? String(i.registeredAt) : undefined,
        })),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load instructors."));
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
      rows.map((i) => ({
        Instructor: i.name,
        Email: i.email,
        Phone: i.phone,
        Status: i.status,
        Courses: i.courses,
        Published: i.published,
        Registered: formatAdminDate(i.registeredAt),
      })),
    [rows],
  );

  return (
    <AdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Instructors
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Instructor profiles, courses, and account status.
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
              title="Instructors"
              subtitle={`${rows.length} instructors`}
              fileName="admin-instructors"
              columns={[
                { key: "Instructor", label: "Instructor" },
                { key: "Email", label: "Email" },
                { key: "Phone", label: "Phone" },
                { key: "Status", label: "Status" },
                { key: "Courses", label: "Courses" },
                { key: "Published", label: "Published" },
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
              {loading ? "Loading…" : `${rows.length} instructors`}
            </p>
          }
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Instructor</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Courses</th>
              <th className="px-5 py-3 font-medium">Published</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-16">
                  <div className="flex justify-center">
                    <Spinner label="Loading instructors" />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <ScrollTableEmpty colSpan={7} message="No instructors found" />
            ) : (
              rows.map((i) => (
                <tr
                  key={i.id}
                  className="border-b border-border/70 hover:bg-accent/40"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage
                          src={mediaPublicUrl(i.avatarUrl)}
                          alt={i.name}
                        />
                        <AvatarFallback className="text-xs font-bold text-primary">
                          {initialsFromName(i.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">{i.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">{i.email}</td>
                  <td className="px-5 py-4 text-muted-foreground">{i.phone}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        adminStatusTone(i.status),
                      )}
                    >
                      {formatAdminStatusLabel(i.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4">{i.courses}</td>
                  <td className="px-5 py-4">{i.published}</td>
                  <StickyActionCell>
                    <Button asChild size="icon" variant="outline" title="View">
                      <Link href={`/admin/instructors/${i.id}`}>
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
