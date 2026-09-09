"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Paperclip, X } from "lucide-react";
import {
  InstructorShell,
  statusTone,
} from "@/components/instructor/InstructorShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  getApiErrorMessage,
  instructorCreateSupportRequest,
  instructorSupportListRequest,
  uploadFileRequest,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
};

function formatStatus(status: string) {
  const key = status.toLowerCase();
  if (key === "open") return "Open";
  if (key === "pending") return "Pending";
  if (key === "replied") return "Replied";
  if (key === "closed") return "Closed";
  return status.charAt(0).toUpperCase() + status.slice(1);
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

export default function InstructorSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setListError("");
    try {
      const data = await instructorSupportListRequest();
      setTickets(Array.isArray(data) ? data : []);
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

  async function onSubmit(e: FormEvent) {
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
        const uploaded = await uploadFileRequest(file);
        attachmentIds.push(uploaded.id);
      }
      await instructorCreateSupportRequest({
        subject: subject.trim(),
        body: message.trim(),
        attachmentIds: attachmentIds.length ? attachmentIds : undefined,
      });
      setSubject("");
      setMessage("");
      setFile(null);
      setFormSuccess("Your support ticket was submitted successfully.");
      await loadTickets();
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not create ticket."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InstructorShell>
      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Technical Support
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create tickets, upload screenshots, and track replies
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-6 card-soft space-y-5 p-5 sm:p-6"
          >
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
                rows={10}
                className="min-h-[220px] font-normal leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <Label>Attachment (optional)</Label>
              <div className="rounded-2xl border border-dashed border-border bg-canvas/50 px-4 py-5 dark:bg-muted/20">
                {file ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Paperclip className="h-4 w-4 shrink-0 text-brand-navy dark:text-brand-lime" />
                      <p className="truncate text-sm font-medium text-ink dark:text-foreground">
                        {file.name}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove file"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-brand-navy dark:text-foreground">
                      Upload image or file
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Screenshots help us resolve issues faster
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>
            </div>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            {formSuccess ? (
              <p className="rounded-2xl bg-brand-lime-soft px-4 py-3 text-sm font-medium text-brand-navy">
                {formSuccess}
              </p>
            ) : null}

            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending…" : "Send ticket"}
            </Button>
          </form>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-bold text-brand-navy dark:text-foreground">
            Ticket History
          </h2>

          {loading ? (
            <div className="flex min-h-[12rem] items-center justify-center">
              <Spinner label="Loading tickets" />
            </div>
          ) : listError ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {listError}
            </p>
          ) : tickets.length === 0 ? (
            <div className="card-soft px-5 py-12 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No support tickets yet. Submit a message to get started.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {tickets.map((t) => {
                const label = formatStatus(t.status);
                return (
                  <li key={t.id} className="card-soft p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-ink dark:text-foreground">
                        {t.subject}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
                          statusTone(label),
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {t.body}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {formatDate(t.createdAt)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </InstructorShell>
  );
}
