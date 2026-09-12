"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { Search } from "lucide-react";
import { MdArrowOutward } from "react-icons/md";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";

export function PortalHeader({
  dashboardHref,
  commandOpen,
  onCommandOpenChange,
  searchPlaceholder = "Search pages…",
  notifications,
  profile,
}: {
  dashboardHref: string;
  commandOpen: boolean;
  onCommandOpenChange: (open: boolean) => void;
  searchPlaceholder?: string;
  notifications: ReactNode;
  profile: ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onCommandOpenChange(!commandOpen);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [commandOpen, onCommandOpenChange]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link
            href={dashboardHref}
            className="relative flex h-11 w-[220px] shrink-0 items-center sm:h-12 sm:w-[260px]"
            aria-label="Qalinraac Academy dashboard"
          >
            <div className="relative h-7 w-48 sm:h-8 sm:w-48">
              <Image
                src="/qalinraacacademy-logo-header.png"
                alt="Qalinraac Academy"
                fill
                className="object-contain object-left"
                sizes="192px"
                priority
              />
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Home
            <MdArrowOutward className="h-4 w-4" aria-hidden />
          </Link>

          <button
            type="button"
            onClick={() => onCommandOpenChange(true)}
            className="relative hidden min-w-0 max-w-md flex-1 text-left md:block"
            aria-label="Search pages"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              readOnly
              tabIndex={-1}
              placeholder={searchPlaceholder}
              className="pointer-events-none h-10 border-border bg-muted/50 pl-11 pr-16 shadow-none"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex h-9 shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onCommandOpenChange(true)}
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Search pages"
          >
            <Search className="h-4 w-4" />
          </button>
          <ThemeToggle className="size-9 shrink-0" />
          <div className="flex size-9 shrink-0 items-center justify-center">
            {notifications}
          </div>
          <div className="flex size-9 shrink-0 items-center justify-center">
            {profile}
          </div>
        </div>
      </div>
    </header>
  );
}
