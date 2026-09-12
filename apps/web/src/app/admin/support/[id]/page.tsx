"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AdminShell,
  adminPriorityTone,
  adminStatusTone,
  formatAdminDate,
  formatAdminStatusLabel,
} from "@/components/admin/AdminShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  adminReplyTicketRequest,
  adminTicketRequest,
  adminUpdateTicketRequest,
  getApiErrorMessage,
  mediaPublicUrl,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

type Reply = {
  authorId: string;
  authorName: string;
  authorRole?: string;
  avatarUrl?: string;
  body: string;
  createdAt?: string;
};

type TicketDetail = {
  id: string;
  subject: string;
  body: string;
  priority: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  user: {
    id: string;
    name: string;
    email?: string;
    role?: string;
    phone?: string;
    avatarUrl?: string;
  };
  replies: Reply[];
};

function parseTicket(raw: Record<string, unknown>): TicketDetail {
  const user = (raw.user ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ""),
    subject: String(raw.subject ?? "—"),
    body: String(raw.body ?? ""),
    priority: String(raw.priority ?? "medium"),
    status: String(raw.status ?? "open"),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
    user: {
      id: String(user.id ?? ""),
      name: String(user.name ?? "—"),
      email: user.email ? String(user.email) : undefined,
      role: user.role ? String(user.role) : undefined,
      phone: user.phone ? String(user.phone) : undefined,
      avatarUrl: user.avatarUrl ? String(user.avatarUrl) : undefined,
    },
    replies: Array.isArray(raw.replies)
      ? (raw.replies as Record<string, unknown>[]).map((r) => ({
          authorId: String(r.authorId ?? ""),
          authorName: String(r.authorName ?? "Staff"),
          authorRole: r.authorRole ? String(r.authorRole) : undefined,
          avatarUrl: r.avatarUrl ? String(r.avatarUrl) : undefined,
          body: String(r.body ?? ""),
          createdAt: r.createdAt ? String(r.createdAt) : undefined,
        }))
      : [],
  };
}

export default function AdminSupportDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      setTicket(parseTicket(await adminTicketRequest(id)));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load ticket."));
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!id || !reply.trim()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      setTicket(parseTicket(await adminReplyTicketRequest(id, reply.trim())));
      setReply("");
      setMessage("Reply sent.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send reply."));
    } finally {
      setBusy(false);
    }
  }

  async function setTicketStatus(next: "open" | "resolved") {
    if (!id) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      setTicket(
        parseTicket(await adminUpdateTicketRequest(id, { status: next })),
      );
      setMessage(
        next === "resolved" ? "Ticket marked as resolved." : "Ticket reopened.",
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not update ticket."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/support">← Support Tickets</Link>
        </Button>

        {loading ? (
          <div className="flex min-h-[14rem] items-center justify-center">
            <Spinner label="Loading ticket" />
          </div>
        ) : error && !ticket ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : ticket ? (
          <div className="space-y-4">
            {error ? (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-2xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
                {message}
              </p>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
              <section className="card-soft flex min-h-[32rem] flex-col p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-5">
                  <div className="min-w-0">
                    <h1 className="font-display text-2xl font-bold text-primary dark:text-foreground">
                      {ticket.subject}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Opened {formatAdminDate(ticket.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        adminPriorityTone(ticket.priority),
                      )}
                    >
                      {formatAdminStatusLabel(ticket.priority)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        adminStatusTone(ticket.status),
                      )}
                    >
                      {formatAdminStatusLabel(ticket.status)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-muted/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Original message
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                      {ticket.body || "—"}
                    </p>
                  </div>

                  <div>
                    <h2 className="mb-3 text-sm font-bold">Conversation</h2>
                    {ticket.replies.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No replies yet.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {ticket.replies.map((r, i) => (
                          <li
                            key={`${r.authorId}-${r.createdAt}-${i}`}
                            className="rounded-2xl border border-border/70 px-4 py-3"
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-9 w-9 border border-border">
                                <AvatarImage
                                  src={mediaPublicUrl(r.avatarUrl)}
                                  alt={r.authorName}
                                />
                                <AvatarFallback className="text-xs font-bold text-primary">
                                  {initialsFromName(r.authorName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-semibold">
                                    {r.authorName}
                                  </p>
                                  {r.authorRole ? (
                                    <span className="text-xs text-muted-foreground">
                                      {r.authorRole}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                                  {r.body}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {formatAdminDate(r.createdAt)}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <form onSubmit={onReply} className="mt-auto space-y-4 pt-6">
                  <label className="block text-sm font-medium">
                    Reply
                    <Textarea
                      rows={4}
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      className="mt-2"
                      placeholder="Write a clear reply to the user…"
                      disabled={busy}
                    />
                  </label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button type="submit" disabled={busy || !reply.trim()}>
                      {busy ? (
                        <Spinner className="sm on-primary" label="Sending" />
                      ) : null}
                      Send reply
                    </Button>
                    <div className="hidden h-8 w-px bg-border sm:block" />
                    {ticket.status === "resolved" ? (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void setTicketStatus("open")}
                      >
                        Reopen ticket
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void setTicketStatus("resolved")}
                      >
                        Mark as resolved
                      </Button>
                    )}
                  </div>
                </form>
              </section>

              <aside className="card-soft h-fit space-y-5 p-6">
                <h2 className="text-base font-bold text-primary dark:text-foreground">
                  User
                </h2>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 border border-border">
                    <AvatarImage
                      src={mediaPublicUrl(ticket.user.avatarUrl)}
                      alt={ticket.user.name}
                    />
                    <AvatarFallback className="font-bold text-primary">
                      {initialsFromName(ticket.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 space-y-1">
                    <p className="font-display text-xl font-bold">
                      {ticket.user.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ticket.user.email || "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ticket.user.phone || "—"}
                    </p>
                  </div>
                </div>

                <dl className="space-y-3 rounded-2xl bg-muted/60 px-4 py-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Role</dt>
                    <dd className="mt-0.5 font-semibold">
                      {ticket.user.role || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Priority</dt>
                    <dd className="mt-0.5 font-semibold">
                      {formatAdminStatusLabel(ticket.priority)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Status</dt>
                    <dd className="mt-0.5 font-semibold">
                      {formatAdminStatusLabel(ticket.status)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Updated</dt>
                    <dd className="mt-0.5 font-semibold">
                      {formatAdminDate(ticket.updatedAt)}
                    </dd>
                  </div>
                </dl>

                <div className="space-y-2">
                  {ticket.status === "resolved" ? (
                    <Button
                      type="button"
                      className="w-full"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void setTicketStatus("open")}
                    >
                      Reopen ticket
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="w-full"
                      disabled={busy}
                      onClick={() => void setTicketStatus("resolved")}
                    >
                      Mark as resolved
                    </Button>
                  )}
                </div>
              </aside>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
