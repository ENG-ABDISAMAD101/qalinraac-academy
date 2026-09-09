"use client";

import { useCallback, useEffect, useState } from "react";
import { AcademicShell } from "@/components/academic/AcademicShell";
import { Spinner } from "@/components/ui/spinner";
import {
  deleteNotificationRequest,
  formatNotificationTime,
  getApiErrorMessage,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
  notificationsList,
  type AppNotification,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AcademicNotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await notificationsList());
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load notifications."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAllRead() {
    const prev = items;
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsReadRequest();
    } catch (err) {
      setItems(prev);
      setError(getApiErrorMessage(err, "Could not mark notifications as read."));
    }
  }

  async function markOneRead(id: string) {
    const target = items.find((n) => n.id === id);
    if (!target || target.read) return;
    setItems((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await markNotificationReadRequest(id);
    } catch (err) {
      setItems((list) =>
        list.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
      setError(getApiErrorMessage(err, "Could not update notification."));
    }
  }

  async function removeOne(id: string) {
    const prev = items;
    setItems((list) => list.filter((n) => n.id !== id));
    try {
      await deleteNotificationRequest(id);
    } catch (err) {
      setItems(prev);
      setError(getApiErrorMessage(err, "Could not delete notification."));
    }
  }

  return (
    <AcademicShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Notifications{" "}
              <span className="text-muted-foreground">{items.length}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              No research notifications in this portal
            </p>
          </div>
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={items.length === 0}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold disabled:opacity-50"
          >
            Mark as read
          </button>
        </div>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading notifications" />
          </div>
        ) : items.length === 0 ? (
          <div className="card-soft px-6 py-12 text-center text-sm text-muted-foreground">
            You&apos;re all caught up. New alerts will appear here.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "card-soft flex flex-wrap items-start justify-between gap-4 p-5",
                  !n.read && "ring-1 ring-primary/40",
                )}
              >
                <div className="flex min-w-0 gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase text-primary">
                    {n.type.slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatNotificationTime(n.createdAt)} · {n.type}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!n.read ? (
                    <button
                      type="button"
                      onClick={() => void markOneRead(n.id)}
                      className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
                    >
                      Mark read
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void removeOne(n.id)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AcademicShell>
  );
}
