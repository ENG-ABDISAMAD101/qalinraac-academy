"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ClipboardCheck,
  FileText,
  FlaskConical,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  BarChart3,
  Library,
  Newspaper,
  Send,
  UserRound,
  Users,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { ResearchHeader } from "@/components/research/ResearchHeader";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";

const NAV = [
  { href: "/research/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/research/projects",
    label: "Research Projects",
    icon: FolderKanban,
  },
  { href: "/research/papers", label: "Research Papers", icon: FileText },
  { href: "/research/researchers", label: "Researchers", icon: Users },
  { href: "/research/submissions", label: "Submissions", icon: Send },
  { href: "/research/reviews", label: "Reviews", icon: ClipboardCheck },
  { href: "/research/publications", label: "Publications", icon: Newspaper },
  {
    href: "/research/resources",
    label: "Research Resources",
    icon: Library,
  },
  { href: "/research/reports", label: "Reports", icon: BarChart3 },
  { href: "/research/notifications", label: "Notifications", icon: Bell },
  { href: "/research/profile", label: "Profile", icon: UserRound },
];

export function ResearchShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, usingDemo } = useAuth();

  useEffect(() => {
    if (!loading && (!user || (user.role !== "Research" && user.role !== "Researcher"))) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <PageLoader label="Loading research portal" />;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <ResearchHeader />
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[250px] shrink-0 flex-col border-r border-border/60 bg-background px-4 py-5 md:flex">
          <p className="mb-3 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <FlaskConical className="h-3.5 w-3.5" />
            Research
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
              Demo mode — research operations only.
            </p>
          ) : null}
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function researchStatusTone(status: string) {
  switch (status) {
    case "Active":
    case "Approved":
    case "Published":
    case "Completed":
    case "Ready for Publication":
      return "bg-primary-soft text-primary";
    case "Submitted":
    case "Under Review":
    case "Resubmitted":
    case "Final Submission":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "Revision Requested":
    case "Draft":
      return "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200";
    case "Rejected":
    case "Inactive":
    case "Archived":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}
