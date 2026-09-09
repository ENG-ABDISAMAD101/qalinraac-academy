"use client";

import { FormEvent, useState } from "react";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { demoSaNotifications } from "@/lib/super-admin-demo-data";
import { cn } from "@/lib/utils";

export default function SuperAdminNotificationsPage() {
  const [items, setItems] = useState(demoSaNotifications);
  const [announcement, setAnnouncement] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  function sendAnnouncement(e: FormEvent) {
    e.preventDefault();
    if (!announcement.trim()) return;
    setItems((prev) => [
      {
        id: `sn-${Date.now()}`,
        actor: "Announcement",
        avatar: "https://api.dicebear.com/9.x/shapes/svg?seed=Announce",
        message: `📢 ${announcement.trim()}`,
        time: "Just now",
        read: false,
      },
      ...prev,
    ]);
    setAnnouncement("");
    setFlash("System announcement queued to all roles (demo).");
  }

  return (
    <SuperAdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform-wide alerts and system announcements
          </p>
        </div>

        <form onSubmit={sendAnnouncement} className="card-soft space-y-3 p-5">
          <label className="block text-sm font-medium">
            Send system announcement
            <textarea
              rows={3}
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
              placeholder="Message for all users…"
            />
          </label>
          <Button type="submit">Send announcement</Button>
          {flash ? (
            <p className="text-sm text-primary">{flash}</p>
          ) : null}
        </form>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() =>
              setItems((prev) => prev.map((n) => ({ ...n, read: true })))
            }
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold"
          >
            Mark all read
          </button>
        </div>

        <ul className="space-y-3">
          {items.map((n) => {
            const initials = n.actor
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <li
                key={n.id}
                className={cn(
                  "card-soft flex flex-wrap items-start justify-between gap-4 p-5",
                  !n.read && "ring-1 ring-primary/40",
                )}
              >
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={n.avatar} alt={n.actor} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{n.actor}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((x) =>
                          x.id === n.id ? { ...x, read: true } : x,
                        ),
                      )
                    }
                    className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold"
                  >
                    Mark read
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) => prev.filter((x) => x.id !== n.id))
                    }
                    className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-destructive"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </SuperAdminShell>
  );
}
