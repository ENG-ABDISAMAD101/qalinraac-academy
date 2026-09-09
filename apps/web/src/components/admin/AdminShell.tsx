"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  BarChart3,
  LifeBuoy,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/instructors", label: "Instructors", icon: GraduationCap },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/support", label: "Support Tickets", icon: LifeBuoy },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/profile", label: "Profile", icon: UserRound },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, usingDemo } = useAuth();

  useEffect(() => {
    if (!loading && (!user || user.role !== "Admin")) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <PageLoader label="Loading admin portal" />;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AdminHeader />
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[250px] shrink-0 flex-col border-r border-border/60 bg-background px-4 py-5 md:flex">
          <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Admin
          </p>
          <nav className="scrollbar-thin flex flex-1 flex-col gap-1 overflow-y-auto">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <Button
            type="button"
            variant="ghost"
            className="mt-4 justify-start rounded-2xl px-3 text-muted-foreground"
            onClick={() => {
              logout();
              router.push("/auth/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          {usingDemo ? (
            <p className="mt-3 px-2 text-[10px] leading-relaxed text-muted-foreground">
              Demo mode — admin operations portal.
            </p>
          ) : null}
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function adminStatusTone(status: string) {
  switch (status) {
    case "Active":
    case "Published":
    case "Resolved":
    case "Closed":
      return "bg-primary-soft text-primary";
    case "Open":
    case "In Progress":
    case "Pending":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "Waiting for User":
      return "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200";
    case "Disabled":
    case "Rejected":
    case "Urgent":
    case "High":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    case "Archived":
    case "Low":
    case "Medium":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function adminPriorityTone(priority: string) {
  switch (priority) {
    case "Urgent":
    case "High":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    case "Medium":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}
