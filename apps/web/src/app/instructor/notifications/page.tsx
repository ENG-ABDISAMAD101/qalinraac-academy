"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { InstructorShell } from "@/components/instructor/InstructorShell";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatNotificationTime,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
  notificationsList,
  type AppNotification,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export default function InstructorNotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await notificationsList());
    } catch {
      setError("Could not load notifications. Please try again.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  );

  const visible = useMemo(() => {
    if (tab === "unread") return items.filter((n) => !n.read);
    return items;
  }, [items, tab]);

  async function markAllRead() {
    const prev = items;
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsReadRequest();
    } catch {
      setItems(prev);
      setError("Could not mark notifications as read.");
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
    } catch {
      setItems((list) =>
        list.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
      setError("Could not update notification.");
    }
  }

  return (
    <InstructorShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Course, quiz, payment, and announcement alerts
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => void markAllRead()}
            disabled={items.length === 0 || unreadCount === 0}
          >
            Mark all read
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 ? (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold tabular-nums dark:bg-[#1A1A1A]">
                  {unreadCount}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading notifications" />
          </div>
        ) : visible.length === 0 ? (
          <div className="card-soft px-6 py-12 text-center text-sm text-muted-foreground">
            {tab === "unread"
              ? "No unread notifications."
              : "You're all caught up. New alerts will appear here."}
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "card-soft flex flex-wrap items-start justify-between gap-4 p-5",
                  !n.read && "ring-1 ring-border",
                )}
              >
                <div className="flex min-w-0 gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase text-foreground dark:bg-[#1A1A1A]">
                    {n.type.slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatNotificationTime(n.createdAt)} · {n.type}
                    </p>
                  </div>
                </div>
                {!n.read ? (
                  <button
                    type="button"
                    onClick={() => void markOneRead(n.id)}
                    className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground dark:bg-[#1A1A1A]"
                  >
                    Mark read
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </InstructorShell>
  );
}
