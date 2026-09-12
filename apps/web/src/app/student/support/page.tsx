"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { StudentShell } from "@/components/student/StudentShell";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  createSupportTicketRequest,
  getApiErrorMessage,
  replySupportTicketRequest,
  studentSupportListRequest,
  updateSupportTicketStatusRequest,
  uploadFileRequest,
  type StudentSupportTicket,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type TicketStatus = "open" | "resolved" | "closed";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Close" },
];

function formatStatus(status: string) {
  const key = status.toLowerCase();
  if (key === "open") return "Open";
  if (key === "resolved") return "Resolved";
  if (key === "closed") return "Closed";
  if (key === "pending") return "Pending";
  if (key === "replied") return "Replied";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusTone(status: string) {
  const label = formatStatus(status);
  if (label === "Resolved") return "bg-muted text-foreground";
  if (label === "Closed") return "bg-muted text-muted-foreground";
  return "bg-primary/10 text-primary dark:bg-primary/15";
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<StudentSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState("issue");

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "urgent">(
    "medium",
  );
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const [statusConfirm, setStatusConfirm] = useState<{
    ticketId: string;
    status: TicketStatus;
  } | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);

  const [replyBody, setReplyBody] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [replyError, setReplyError] = useState("");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const data = await studentSupportListRequest();
      setTickets(data);
    } catch (err) {
      setListError(getApiErrorMessage(err, "Could not load support tickets."));
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === "open").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    const closed = tickets.filter((t) => t.status === "closed").length;
    return { total: tickets.length, open, resolved, closed };
  }, [tickets]);

  function resetForm() {
    setSubject("");
    setMessage("");
    setPriority("medium");
    setFile(null);
    setUploadProgress(null);
    setFormError("");
    setFormSuccess("");
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    if (!subject.trim() || !message.trim()) {
      setFormError("Subject and message are required.");
      return;
    }
    setSubmitting(true);
    try {
      const attachmentIds: string[] = [];
      if (file) {
        setUploadProgress(15);
        const tick = window.setInterval(() => {
          setUploadProgress((p) =>
            p == null || p >= 90 ? p : Math.min(90, p + 8),
          );
        }, 100);
        try {
          const uploaded = await uploadFileRequest(file);
          attachmentIds.push(uploaded.id);
          setUploadProgress(100);
        } finally {
          window.clearInterval(tick);
        }
      }
      await createSupportTicketRequest({
        subject: subject.trim(),
        body: message.trim(),
        priority,
        attachmentIds: attachmentIds.length ? attachmentIds : undefined,
      });
      resetForm();
      setFormSuccess("Your support ticket was submitted successfully.");
      await loadTickets();
      setTimeout(() => {
        setCreateOpen(false);
        setFormSuccess("");
      }, 700);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not create ticket."));
      setUploadProgress(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmStatusChange() {
    if (!statusConfirm) return;
    setStatusBusy(true);
    try {
      const updated = await updateSupportTicketStatusRequest(
        statusConfirm.ticketId,
        statusConfirm.status,
      );
      setTickets((list) =>
        list.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
      );
      setStatusConfirm(null);
    } catch (err) {
      setListError(getApiErrorMessage(err, "Could not update ticket status."));
      setStatusConfirm(null);
    } finally {
      setStatusBusy(false);
    }
  }

  async function sendReply(ticketId: string) {
    if (!replyBody.trim()) {
      setReplyError("Write a message before sending.");
      return;
    }
    setReplyBusy(true);
    setReplyError("");
    try {
      const updated = await replySupportTicketRequest(
        ticketId,
        replyBody.trim(),
      );
      setTickets((list) =>
        list.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
      );
      setReplyBody("");
    } catch (err) {
      setReplyError(getApiErrorMessage(err, "Could not send reply."));
    } finally {
      setReplyBusy(false);
    }
  }

  return (
    <StudentShell>
      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Technical Support
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create tickets, upload screenshots, and track replies
            </p>
          </div>
          <Button
            type="button"
            className="rounded-2xl"
            onClick={() => {
              resetForm();
              setCreateOpen(true);
            }}
          >
            New ticket
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Total", value: stats.total },
            { label: "Open", value: stats.open },
            { label: "Resolved", value: stats.resolved },
            { label: "Closed", value: stats.closed },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-card px-4 py-4"
            >
              <p className="text-xs font-medium text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold text-primary dark:text-foreground">
            Ticket history
          </h2>

          {loading ? (
            <div className="flex min-h-[12rem] items-center justify-center">
              <Spinner label="Loading tickets" />
            </div>
          ) : listError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {listError}
            </p>
          ) : tickets.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No tickets yet
            </p>
          ) : (
            <ul className="space-y-3">
              {tickets.map((t) => {
                const open = openId === t.id;
                const replies = t.replies ?? [];
                return (
                  <li
                    key={t.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 p-4 text-left sm:p-5"
                      onClick={() => {
                        setOpenId(open ? null : t.id);
                        setDetailTab("issue");
                        setReplyBody("");
                        setReplyError("");
                      }}
                      aria-expanded={open}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {t.subject}
                          </p>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                              statusTone(t.status),
                            )}
                          >
                            {formatStatus(t.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(t.createdAt)}
                          {t.priority ? ` · ${t.priority}` : ""}
                        </p>
                      </div>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border">
                        {open ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </span>
                    </button>

                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-200",
                        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="border-t border-border px-4 pb-5 pt-3 sm:px-5">
                          <Tabs
                            value={detailTab}
                            onValueChange={setDetailTab}
                          >
                            <TabsList>
                              <TabsTrigger value="issue">Issue</TabsTrigger>
                              <TabsTrigger value="discussions">
                                Discussions
                              </TabsTrigger>
                            </TabsList>

                            <TabsContent value="issue" className="mt-4 space-y-4">
                              <div>
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  Description
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                                  {t.body}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  Date
                                </p>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                  {formatDate(t.createdAt)}
                                </p>
                              </div>
                              <div>
                                <Label
                                  htmlFor={`status-${t.id}`}
                                  className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
                                >
                                  Set as
                                </Label>
                                <select
                                  id={`status-${t.id}`}
                                  value={t.status}
                                  className="flex h-11 w-full max-w-xs rounded-full border border-input bg-background px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                  onChange={(e) => {
                                    const next = e.target.value as TicketStatus;
                                    if (next === t.status) return;
                                    setStatusConfirm({
                                      ticketId: t.id,
                                      status: next,
                                    });
                                  }}
                                >
                                  {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </TabsContent>

                            <TabsContent
                              value="discussions"
                              className="mt-4 space-y-4"
                            >
                              {replies.length === 0 ? (
                                <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                                  Chat administrator — no messages yet. Send the
                                  first reply below.
                                </p>
                              ) : (
                                <ul className="space-y-3">
                                  {replies.map((r, idx) => {
                                    const isAdmin =
                                      user?._id && r.authorId !== user._id;
                                    return (
                                      <li
                                        key={`${t.id}-reply-${idx}`}
                                        className="rounded-xl border border-border bg-canvas px-4 py-3 dark:bg-[#1A1A1A]"
                                      >
                                        <p className="text-xs font-semibold text-muted-foreground">
                                          {isAdmin
                                            ? "Reply · Administrator"
                                            : "You"}
                                          {" · "}
                                          {formatDate(String(r.createdAt))}
                                        </p>
                                        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                                          {r.body}
                                        </p>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}

                              <div className="space-y-2">
                                <Label htmlFor={`reply-${t.id}`}>
                                  {replies.length
                                    ? "Reply"
                                    : "Message administrator"}
                                </Label>
                                <Textarea
                                  id={`reply-${t.id}`}
                                  value={open ? replyBody : ""}
                                  onChange={(e) => setReplyBody(e.target.value)}
                                  rows={4}
                                  placeholder="Write your message…"
                                />
                                {replyError ? (
                                  <p className="text-sm text-destructive">
                                    {replyError}
                                  </p>
                                ) : null}
                                <Button
                                  type="button"
                                  className="rounded-xl"
                                  disabled={replyBusy}
                                  onClick={() => void sendReply(t.id)}
                                >
                                  {replyBusy ? "Sending…" : "Send message"}
                                </Button>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(next) => {
          setCreateOpen(next);
          if (!next) resetForm();
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New support ticket</DialogTitle>
            <DialogDescription>
              Describe the issue clearly. Attachments are optional and help our
              team investigate faster.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of the issue"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the problem in detail…"
                required
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "high" | "medium" | "urgent")
                }
                className="flex h-11 w-full rounded-full border border-input bg-background px-4 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Attachment (optional)</Label>
              <FileDropzone
                id="support-file"
                accept="image/*,.pdf,.png,.jpg,.jpeg,.webp"
                formatsLabel="PNG, JPG, WEBP, PDF"
                disabled={submitting}
                file={file}
                progress={file ? uploadProgress : null}
                onFileChange={(next) => {
                  setFile(next);
                  setUploadProgress(next ? 0 : null);
                }}
              />
            </div>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            {formSuccess ? (
              <p className="rounded-xl bg-muted px-4 py-3 text-sm font-medium text-foreground">
                {formSuccess}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending…" : "Send ticket"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(statusConfirm)}
        onOpenChange={(next) => {
          if (!next) setStatusConfirm(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm status change</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this ticket as{" "}
              <span className="font-semibold text-foreground">
                {STATUS_OPTIONS.find((o) => o.value === statusConfirm?.status)
                  ?.label ?? statusConfirm?.status}
              </span>
              ? This updates how the ticket appears in your history and for the
              support team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatusConfirm(null)}
              disabled={statusBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={statusBusy}
              onClick={() => void confirmStatusChange()}
            >
              {statusBusy ? "Updating…" : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudentShell>
  );
}
