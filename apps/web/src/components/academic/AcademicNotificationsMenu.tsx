"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBellTrigger } from "@/components/ui/notification-bell";
import { Spinner } from "@/components/ui/spinner";
import {
  formatNotificationTime,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
  notificationsList,
  type AppNotification,
} from "@/lib/api";
import { cn } from "@/lib/utils";

export function AcademicNotificationsMenu() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await notificationsList());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  );

  async function markAllRead() {
    const prev = items;
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsReadRequest();
    } catch {
      setItems(prev);
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
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <NotificationBellTrigger count={unreadCount} />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className={cn(
          "w-[min(100vw-1.5rem,24rem)] overflow-hidden rounded-2xl p-0 shadow-xl",
          open && "brand-notif-spin",
        )}
      >
        <DropdownMenuLabel className="flex items-center justify-between gap-3 px-4 py-3 font-normal">
          <p className="text-sm font-semibold text-primary">
            Notifications{" "}
            <span className="text-muted-foreground">{items.length}</span>
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              void markAllRead();
            }}
            className="rounded-md px-1 text-xs font-semibold text-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Mark as read
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />

        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner className="sm" label="Loading notifications" />
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            You&apos;re all caught up. No notifications yet.
          </p>
        ) : (
          <ul className="scrollbar-thin max-h-[min(70vh,28rem)] overflow-y-auto py-1">
            {items.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void markOneRead(n.id)}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                    !n.read && "bg-primary-soft/40 dark:bg-secondary/50",
                  )}
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase text-primary">
                    {n.type.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {n.body}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {formatNotificationTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.read ? (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border px-4 py-3">
          <Link
            href="/academic/notifications"
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline dark:text-primary"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
