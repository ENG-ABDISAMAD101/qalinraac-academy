"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  adminNotificationsRequest,
  deleteNotificationRequest,
  formatNotificationTime,
  getApiErrorMessage,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type Notif = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await adminNotificationsRequest();
      setItems(
        (rows ?? []).map((n) => ({
          id: String(n.id ?? ""),
          title: String(n.title ?? "Notification"),
          body: String(n.body ?? ""),
          type: String(n.type ?? "info"),
          read: Boolean(n.read),
          createdAt: String(n.createdAt ?? new Date().toISOString()),
        })),
      );
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

  async function markAll() {
    try {
      await markAllNotificationsReadRequest();
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not mark notifications read."));
    }
  }

  return (
    <AdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Notifications{" "}
              <span className="text-muted-foreground">{items.length}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Registrations, tickets, course updates, certificates, announcements
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => void markAll()}>
            Mark as read
          </Button>
        </div>

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading notifications" />
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No notifications yet
          </p>
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
                <div>
                  <p className="font-semibold">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatNotificationTime(n.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!n.read ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void markNotificationReadRequest(n.id).then(load)
                      }
                    >
                      Mark read
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() =>
                      void deleteNotificationRequest(n.id).then(load)
                    }
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}
