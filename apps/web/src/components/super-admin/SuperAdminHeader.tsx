"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { SuperAdminNotificationsMenu } from "@/components/super-admin/SuperAdminNotificationsMenu";
import { SuperAdminProfileMenu } from "@/components/super-admin/SuperAdminProfileMenu";

export function SuperAdminHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <Link
            href="/super-admin/dashboard"
            className="flex shrink-0 items-center gap-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-navy text-sm font-bold lowercase text-brand-lime shadow-sm">
              q
            </span>
            <span className="hidden font-display text-xl font-bold tracking-tight text-brand-navy dark:text-foreground sm:inline">
              Qalinraac
            </span>
          </Link>
          <label className="relative min-w-0 max-w-xl flex-1">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users, settings, audit logs..."
              className="h-11 border-0 bg-muted/60 pl-11 shadow-sm dark:bg-muted"
            />
          </label>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <SuperAdminNotificationsMenu />
          <SuperAdminProfileMenu />
        </div>
      </div>
    </header>
  );
}
