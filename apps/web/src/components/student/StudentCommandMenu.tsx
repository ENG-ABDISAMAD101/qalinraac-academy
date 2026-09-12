"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { STUDENT_COMMAND_PAGES } from "@/components/student/student-nav";
import { cn } from "@/lib/utils";

export function StudentCommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STUDENT_COMMAND_PAGES;
    return STUDENT_COMMAND_PAGES.filter((page) => {
      const hay = [page.label, page.href, ...(page.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        hideClose
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search pages</DialogTitle>
          <DialogDescription>
            Jump to Home or any student portal page.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) {
                e.preventDefault();
                go(results[0].href);
              }
            }}
          />
          <DialogClose
            type="button"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </DialogClose>
        </div>

        <ul className="scrollbar-thin max-h-[min(60vh,22rem)] overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              No pages match “{query.trim()}”.
            </li>
          ) : (
            results.map((page, index) => {
              const Icon = page.icon;
              return (
                <li key={page.href}>
                  <button
                    type="button"
                    onClick={() => go(page.href)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
                      index === 0 && !query.trim() && "bg-muted/50",
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-foreground">
                        {page.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {page.href === "/" ? "Public site" : "Student portal"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
