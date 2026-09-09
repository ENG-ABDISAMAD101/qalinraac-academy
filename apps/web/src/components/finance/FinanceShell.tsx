"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  UserRound,
  Wallet,
  Receipt,
  HandCoins,
  Banknote,
  Users,
  BarChart3,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { FinanceHeader } from "@/components/finance/FinanceHeader";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";

const NAV = [
  { href: "/finance/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/finance/revenue", label: "Revenue", icon: Wallet },
  { href: "/finance/expenses", label: "Expenses", icon: Receipt },
  {
    href: "/finance/instructor-payments",
    label: "Instructor Payments",
    icon: HandCoins,
  },
  { href: "/finance/withdrawals", label: "Withdrawals", icon: Banknote },
  { href: "/finance/shareholders", label: "Shareholders", icon: Users },
  { href: "/finance/reports", label: "Reports", icon: BarChart3 },
  { href: "/finance/notifications", label: "Notifications", icon: Bell },
  { href: "/finance/profile", label: "Profile", icon: UserRound },
];

export function FinanceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, usingDemo } = useAuth();

  useEffect(() => {
    if (!loading && (!user || (user.role !== "Finance" && user.role !== "SuperAdmin"))) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <PageLoader label="Loading finance portal" />;
  }

  return (
    <div className="min-h-screen bg-canvas">
      <FinanceHeader />
      <div className="mx-auto flex max-w-[1440px]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-[250px] shrink-0 flex-col border-r border-border/60 bg-background px-4 py-5 md:flex">
          <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Finance
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
              Demo mode — finance portal.
            </p>
          ) : null}
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

export function financeStatusTone(status: string) {
  switch (status) {
    case "Completed":
    case "Approved":
    case "Distributed":
    case "Paid":
      return "bg-primary-soft text-primary";
    case "Pending":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "Rejected":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function money(n: number) {
  return `$${n.toLocaleString()}`;
}
