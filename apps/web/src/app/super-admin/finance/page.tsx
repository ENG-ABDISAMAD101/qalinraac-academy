"use client";

import Link from "next/link";
import {
  SuperAdminShell,
  money,
  saStatusTone,
} from "@/components/super-admin/SuperAdminShell";
import { Button } from "@/components/ui/button";
import { demoSaFinance } from "@/lib/super-admin-demo-data";
import { cn } from "@/lib/utils";

export default function SuperAdminFinancePage() {
  const f = demoSaFinance;

  return (
    <SuperAdminShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Finance Control
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Revenue, expenses, withdrawals, shareholders — payment APIs are in
              Integrations
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/super-admin/integrations">Payment settings</Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Revenue", money(f.revenue)],
            ["Total Expenses", money(f.expenses)],
            ["Net Profit", money(f.netProfit)],
            ["Instructor share", `${f.instructorSharePct}%`],
          ].map(([label, value]) => (
            <div key={String(label)} className="card-soft px-5 py-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        <section className="card-soft overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold">Pending withdrawals</h2>
          </div>
          <ul className="divide-y divide-border/70">
            {f.pendingWithdrawals.map((w) => (
              <li
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div>
                  <p className="font-semibold">{w.instructor}</p>
                  <p className="text-sm text-muted-foreground">
                    {money(w.amount)}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold",
                    saStatusTone(w.status),
                  )}
                >
                  {w.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-soft overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-bold">Shareholders</h2>
          </div>
          <ul className="divide-y divide-border/70">
            {f.shareholders.map((s) => (
              <li
                key={s.name}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted-foreground">
                  {s.share}% · {money(s.profit)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SuperAdminShell>
  );
}
