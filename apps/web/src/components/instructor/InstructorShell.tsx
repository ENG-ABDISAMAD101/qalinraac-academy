"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  Bell,
  BookOpen,
  ClipboardList,
  FileText,
  FolderOpen,
  HeadphonesIcon,
  LayoutDashboard,
  LogOut,
  Users,
  Wallet,
  Banknote,
  UserRound,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { InstructorHeader } from "@/components/instructor/InstructorHeader";
import { InstructorOnboarding } from "@/components/instructor/InstructorOnboarding";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";

const NAV = [
  { href: "/instructor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/instructor/courses", label: "My Courses", icon: BookOpen },
  { href: "/instructor/students", label: "Students", icon: Users },
  { href: "/instructor/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/instructor/quizzes", label: "Quizzes", icon: Award },
  { href: "/instructor/resources", label: "Resources", icon: FolderOpen },
  { href: "/instructor/earnings", label: "Earnings", icon: Wallet },
  { href: "/instructor/withdrawals", label: "Withdrawals", icon: Banknote },
  { href: "/instructor/agreement", label: "Agreement", icon: FileText },
  { href: "/instructor/support", label: "Technical Support", icon: HeadphonesIcon },
  { href: "/instructor/notifications", label: "Notifications", icon: Bell },
  { href: "/instructor/profile", label: "Profile", icon: UserRound },
];

export function InstructorShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, usingDemo, onboardingCompleted } = useAuth();

  useEffect(() => {
    if (!loading && (!user || user.role !== "Instructor")) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <PageLoader label="Loading" />;
  }

  if (user.role !== "Instructor") {
    return <PageLoader label="Loading" />;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <InstructorOnboarding />
      <InstructorHeader />
      <div
        className={cn(
          "mx-auto flex max-w-[1440px]",
          !onboardingCompleted && "pointer-events-none select-none blur-[2px]",
        )}
      >
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[240px] shrink-0 flex-col border-r border-border/60 bg-background px-4 py-5 md:flex">
          <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Instructor
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
              Demo mode — instructor portal.
            </p>
          ) : null}
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function statusTone(status: string) {
  switch (status) {
    case "Published":
    case "Passed":
    case "Completed":
    case "Paid":
      return "bg-primary-soft text-primary";
    case "Pending Review":
    case "Pending":
    case "Submitted":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "Rejected":
    case "Failed":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    case "Draft":
    case "Archived":
    default:
      return "bg-muted text-muted-foreground";
  }
}
