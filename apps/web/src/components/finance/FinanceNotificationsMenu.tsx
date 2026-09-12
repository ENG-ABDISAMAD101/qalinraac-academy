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

export function FinanceNotificationsMenu() {
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
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <NotificationBellTrigger count={unreadCount} className="size-9" />
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
            className="rounded-md px-1 text-xs font-semibold text-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-primary"
          >
            Mark as read
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        <ul className="scrollbar-thin max-h-[min(70vh,28rem)] overflow-y-auto py-1">
          {loading ? (
            <li className="flex justify-center py-8">
              <Spinner label="Loading" />
            </li>
          ) : items.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications
            </li>
          ) : (
            items.slice(0, 8).map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void markOneRead(n.id)}
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition hover:bg-muted/50",
                  !n.read && "bg-primary-soft/30",
                  )}
                >
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold uppercase text-primary">
                    QA
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {n.title}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                      {n.body}
                    </span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {formatNotificationTime(n.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        <DropdownMenuSeparator className="my-0" />
        <div className="px-4 py-3">
          <Link
            href="/finance/notifications"
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
