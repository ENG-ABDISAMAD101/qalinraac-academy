"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  Bell,
  BookOpen,
  ClipboardList,
  Database,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  BarChart3,
  Plug,
  Settings,
  Shield,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  KeyRound,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { SuperAdminHeader } from "@/components/super-admin/SuperAdminHeader";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/super-admin/users", label: "Users", icon: Users },
      {
        href: "/super-admin/roles",
        label: "Roles & Permissions",
        icon: KeyRound,
      },
      { href: "/super-admin/students", label: "Students", icon: GraduationCap },
      {
        href: "/super-admin/instructors",
        label: "Instructors",
        icon: Users,
      },
      { href: "/super-admin/academic", label: "Academic", icon: ClipboardList },
    ],
  },
  {
    label: "Learning",
    items: [
      { href: "/super-admin/courses", label: "Courses", icon: BookOpen },
      { href: "/super-admin/certificates", label: "Certificates", icon: Award },
    ],
  },
  {
    label: "Business",
    items: [
      { href: "/super-admin/finance", label: "Finance", icon: Wallet },
      { href: "/super-admin/research", label: "Research", icon: FlaskConical },
      { href: "/super-admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/super-admin/notifications",
        label: "Notifications",
        icon: Bell,
      },
      { href: "/super-admin/support", label: "Support", icon: LifeBuoy },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        href: "/super-admin/settings",
        label: "System Settings",
        icon: Settings,
      },
      {
        href: "/super-admin/integrations",
        label: "Integrations",
        icon: Plug,
      },
      {
        href: "/super-admin/storage",
        label: "Storage & Videos",
        icon: Database,
      },
      { href: "/super-admin/security", label: "Security", icon: Shield },
      {
        href: "/super-admin/audit-logs",
        label: "Audit Logs",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/super-admin/profile", label: "Profile", icon: UserRound },
    ],
  },
];

export function SuperAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, usingDemo } = useAuth();

  useEffect(() => {
    if (!loading && (!user || (user.role !== "Super Admin" && user.role !== "SuperAdmin"))) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <PageLoader label="Loading super admin portal" />;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <SuperAdminHeader />
      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[260px] shrink-0 flex-col border-r border-border/60 bg-background px-3 py-4 lg:flex">
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Super Admin
          </p>
          <nav className="scrollbar-thin flex flex-1 flex-col gap-4 overflow-y-auto pb-2">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {group.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors",
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
                </div>
              </div>
            ))}
          </nav>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 justify-start rounded-xl px-2.5 text-muted-foreground"
            onClick={() => {
              logout();
              router.push("/auth/login");
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
          {usingDemo ? (
            <p className="mt-2 px-2 text-[10px] leading-relaxed text-muted-foreground">
              Demo mode — full system control center.
            </p>
          ) : null}
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function saStatusTone(status: string) {
  switch (status) {
    case "Active":
    case "Published":
    case "Approved":
    case "Ready":
    case "Signed":
    case "Completed":
      return "bg-brand-lime-soft text-brand-navy";
    case "Pending":
    case "Pending Review":
    case "In Progress":
    case "Review":
    case "Submitted":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "Disabled":
    case "Rejected":
    case "Urgent":
    case "High":
    case "Open":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    case "Waiting for User":
      return "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function money(n: number) {
  return `$${n.toLocaleString()}`;
}
