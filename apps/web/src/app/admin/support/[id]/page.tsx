"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  AdminShell,
  adminPriorityTone,
  adminStatusTone,
} from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  demoAdminTickets,
  type AdminTicketStatus,
} from "@/lib/admin-demo-data";
import { cn } from "@/lib/utils";

export default function AdminSupportDetailPage() {
  const params = useParams<{ id: string }>();
  const base =
    demoAdminTickets.find((t) => t.id === params.id) ?? demoAdminTickets[0];
  const [status, setStatus] = useState<AdminTicketStatus>(base.status);
  const [reply, setReply] = useState("");
  const [replies, setReplies] = useState(base.replies);
  const [flash, setFlash] = useState<string | null>(null);

  function onReply(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setReplies((prev) => [
      ...prev,
      {
        from: "Faisal Hassan",
        body: reply.trim(),
        at: "Just now",
      },
    ]);
    setReply("");
    if (status === "Open") setStatus("In Progress");
    setFlash("Reply sent (demo).");
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/support">← Support Tickets</Link>
        </Button>
        <div className="card-soft space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-muted-foreground">{base.id}</p>
              <h1 className="font-display text-2xl font-bold text-primary dark:text-foreground">
                {base.subject}
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  adminPriorityTone(base.priority),
                )}
              >
                {base.priority}
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold",
                  adminStatusTone(status),
                )}
              >
                {status}
              </span>
            </div>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">User</dt>
              <dd className="font-semibold">{base.user}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-semibold">{base.userRole}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-semibold">{base.createdAt}</dd>
            </div>
          </dl>
          <p className="rounded-2xl bg-muted px-4 py-3 text-sm">{base.message}</p>

          <div className="space-y-3">
            <h2 className="text-sm font-bold">Thread</h2>
            {replies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No replies yet.</p>
            ) : (
              replies.map((r, i) => (
                <div key={`${r.at}-${i}`} className="rounded-2xl border border-border px-4 py-3">
                  <p className="text-sm font-semibold">{r.from}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.at}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={onReply} className="space-y-3">
            <label className="block text-sm font-medium">
              Reply
              <textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                placeholder="Write a reply to the user…"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Send reply</Button>
              {status !== "Closed" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStatus("Closed");
                    setFlash("Ticket closed.");
                  }}
                >
                  Close
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStatus("Open");
                    setFlash("Ticket reopened.");
                  }}
                >
                  Reopen
                </Button>
              )}
              {status === "Resolved" ? null : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setStatus("Resolved");
                    setFlash("Marked resolved.");
                  }}
                >
                  Mark resolved
                </Button>
              )}
            </div>
          </form>
          {flash ? (
            <p className="text-sm font-medium text-primary">
              {flash}
            </p>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
