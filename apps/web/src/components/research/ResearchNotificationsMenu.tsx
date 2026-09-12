"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBellTrigger } from "@/components/ui/notification-bell";
import { demoResearchNotifications } from "@/lib/research-demo-data";
import { cn } from "@/lib/utils";

type Notif = (typeof demoResearchNotifications)[number];

export function ResearchNotificationsMenu() {
  const [items, setItems] = useState<Notif[]>(demoResearchNotifications);
  const [open, setOpen] = useState(false);
  const unreadCount = useMemo(
    () => items.filter((n) => !n.read).length,
    [items],
  );
  const totalNumber = items.length;
  const badgeCount = unreadCount > 0 ? unreadCount : totalNumber;

  return (
    <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <NotificationBellTrigger count={badgeCount} className="size-9" />
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
            <span className="text-muted-foreground">{totalNumber}</span>
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setItems((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
            className="rounded-md px-1 text-xs font-semibold text-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Mark as read
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-0" />
        <ul className="scrollbar-thin max-h-[min(70vh,28rem)] overflow-y-auto py-1">
          {items.map((n) => {
            const initials = n.actor
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() =>
                    setItems((prev) =>
                      prev.map((x) =>
                        x.id === n.id ? { ...x, read: true } : x,
                      ),
                    )
                  }
                  className={cn(
                    "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                    !n.read && "bg-primary-soft/40 dark:bg-secondary/50",
                  )}
                >
                  <Avatar className="mt-0.5 h-10 w-10 border border-border">
                    <AvatarImage src={n.avatar} alt={n.actor} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{n.actor}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {n.message}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {n.time}
                    </p>
                  </div>
                  {!n.read ? (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
