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
  adminPriorityTone,
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
  adminTicketsRequest,
  getApiErrorMessage,
  mediaPublicUrl,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

type TicketRow = {
  id: string;
  subject: string;
  priority: string;
  status: string;
  user: string;
  email: string;
  role: string;
  avatarUrl?: string;
  updatedAt?: string;
  createdAt?: string;
};

type StatusFilter = "all" | "open" | "resolved";
type PriorityFilter = "all" | "high" | "medium" | "urgent";

export default function AdminSupportPage() {
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [stats, setStats] = useState({ open: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminTicketsRequest({
        q: q.trim() || undefined,
        status: status === "all" ? undefined : status,
        priority: priority === "all" ? undefined : priority,
      });
      setStats({
        open: Number(res.stats?.open ?? 0),
        resolved: Number(res.stats?.resolved ?? 0),
      });
      setRows(
        (res.items ?? []).map((t) => ({
          id: String(t.id ?? ""),
          subject: String(t.subject ?? "—"),
          priority: String(t.priority ?? "medium"),
          status: String(t.status ?? "open"),
          user: String(t.user ?? "—"),
          email: String(t.email ?? "—"),
          role: String(t.role ?? "—"),
          avatarUrl: t.avatarUrl ? String(t.avatarUrl) : undefined,
          updatedAt: t.updatedAt ? String(t.updatedAt) : undefined,
          createdAt: t.createdAt ? String(t.createdAt) : undefined,
        })),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load support tickets."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q, status, priority]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const downloadRows = useMemo(
    () =>
      rows.map((t) => ({
        User: t.user,
        Email: t.email,
        Role: t.role,
        Subject: t.subject,
        Priority: formatAdminStatusLabel(t.priority),
        Status: formatAdminStatusLabel(t.status),
        Updated: formatAdminDate(t.updatedAt),
      })),
    [rows],
  );

  return (
    <AdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Support Tickets
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Reply to user tickets and keep requests open or resolved.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[14rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search subject, user, or email…"
                className="pl-9"
              />
            </div>
            <AdminDownloadMenu
              title="Support Tickets"
              subtitle={`${rows.length} tickets`}
              fileName="admin-support-tickets"
              columns={[
                { key: "User", label: "User" },
                { key: "Email", label: "Email" },
                { key: "Role", label: "Role" },
                { key: "Subject", label: "Subject" },
                { key: "Priority", label: "Priority" },
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
            <p className="text-xs font-medium text-muted-foreground">Open</p>
            <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
              {stats.open}
            </p>
          </div>
          <div className="card-soft px-5 py-4">
            <p className="text-xs font-medium text-muted-foreground">Resolved</p>
            <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
              {stats.resolved}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All"],
              ["open", "Open"],
              ["resolved", "Resolved"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold",
                status === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 hidden h-8 w-px bg-border sm:block" />
          {(
            [
              ["all", "All priority"],
              ["high", "High"],
              ["medium", "Medium"],
              ["urgent", "Urgent"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPriority(value)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold",
                priority === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <ScrollTable
          minWidthClassName="min-w-[60rem]"
          maxHeightClassName="max-h-[32rem]"
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">User</th>
              <th className="px-5 py-3 font-medium">Subject</th>
              <th className="px-5 py-3 font-medium">Priority</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Updated</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-16">
                  <div className="flex justify-center">
                    <Spinner label="Loading tickets" />
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <ScrollTableEmpty colSpan={6} message="No tickets found" />
            ) : (
              rows.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-border/70 hover:bg-accent/40"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage
                          src={mediaPublicUrl(t.avatarUrl)}
                          alt={t.user}
                        />
                        <AvatarFallback className="text-xs font-bold text-primary">
                          {initialsFromName(t.user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold">{t.user}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {t.role}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[16rem] px-5 py-4">
                    <span className="line-clamp-1">{t.subject}</span>
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
      </div>
    </AdminShell>
  );
}
