"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  Bell,
  BookOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  BarChart3,
  UserRound,
  Users,
  GraduationCap,
  KeyRound,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { AcademicHeader } from "@/components/academic/AcademicHeader";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";

const NAV = [
  { href: "/academic/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/academic/students", label: "Students", icon: Users },
  { href: "/academic/instructors", label: "Instructors", icon: GraduationCap },
  { href: "/academic/courses", label: "Courses", icon: BookOpen },
  {
    href: "/academic/activations",
    label: "Student Activations",
    icon: KeyRound,
  },
  { href: "/academic/certificates", label: "Certificates", icon: Award },
  {
    href: "/academic/agreements",
    label: "Instructor Agreements",
    icon: FileText,
  },
  { href: "/academic/reports", label: "Reports", icon: BarChart3 },
  { href: "/academic/notifications", label: "Notifications", icon: Bell },
  { href: "/academic/profile", label: "Profile", icon: UserRound },
];

export function AcademicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, usingDemo } = useAuth();

  useEffect(() => {
    if (
      !loading &&
      (!user ||
        (user.role !== "Academic" && user.role !== "SuperAdmin"))
    ) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <PageLoader label="Loading academic portal" />;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <AcademicHeader />
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[250px] shrink-0 flex-col border-r border-border/60 bg-background px-4 py-5 md:flex">
          <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Academic
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
                      ? "bg-brand-navy text-white shadow-sm dark:bg-brand-lime dark:text-brand-navy"
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
              Demo mode — academic portal.
            </p>
          ) : null}
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function academicStatusTone(status: string) {
  switch (status) {
    case "Published":
    case "Approved":
    case "Active":
    case "Ready":
    case "Completed":
      return "bg-brand-lime-soft text-brand-navy";
    case "Pending Review":
    case "Pending":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "Rejected":
    case "Inactive":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    case "Draft":
    case "Archived":
    default:
      return "bg-muted text-muted-foreground";
  }
}
