"use client";

import { useState } from "react";
import { ResearchShell } from "@/components/research/ResearchShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { demoResearchNotifications } from "@/lib/research-demo-data";
import { cn } from "@/lib/utils";

export default function ResearchNotificationsPage() {
  const [items, setItems] = useState(demoResearchNotifications);

  return (
    <ResearchShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Notifications{" "}
              <span className="text-muted-foreground">{items.length}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Submissions, reviews, revisions, approvals, publications
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setItems((prev) => prev.map((n) => ({ ...n, read: true })))
            }
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold"
          >
            Mark all as read
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
    </ResearchShell>
  );
}
