"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  FinanceShell,
  financeStatusTone,
  money,
} from "@/components/finance/FinanceShell";
import { Button } from "@/components/ui/button";
import {
  ScrollTable,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import {
  demoExpenseOverview,
  demoFinanceChart,
  demoFinanceExpenses,
  demoFinanceRevenue,
  demoFinanceStats,
  demoFinanceWithdrawals,
  demoRevenueOverview,
} from "@/lib/finance-demo-data";
import { cn } from "@/lib/utils";

export default function FinanceDashboardPage() {
  const stats = [
    { label: "Total Revenue", value: money(demoFinanceStats.totalRevenue) },
    { label: "Total Expenses", value: money(demoFinanceStats.totalExpenses) },
    { label: "Net Profit", value: money(demoFinanceStats.netProfit) },
    {
      label: "Pending Withdrawals",
      value: demoFinanceStats.pendingWithdrawals,
    },
    {
      label: "Total Instructor Payments",
      value: money(demoFinanceStats.totalInstructorPayments),
    },
    {
      label: "Active Shareholders",
      value: demoFinanceStats.activeShareholders,
    },
  ];

  const pending = demoFinanceWithdrawals.filter((w) => w.status === "Pending");

  return (
    <FinanceShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Finance Control Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue, expenses, withdrawals, and distributions
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="card-soft px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-navy dark:text-foreground">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="card-soft p-5">
            <h2 className="mb-3 text-base font-bold">Revenue Overview</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Today", demoRevenueOverview.today],
                ["Weekly", demoRevenueOverview.weekly],
                ["Monthly", demoRevenueOverview.monthly],
                ["Annual", demoRevenueOverview.annual],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl bg-muted px-3 py-3">
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="font-bold">{money(Number(value))}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Course Sales {money(demoRevenueOverview.courseSales)} · Manual
              Income {money(demoRevenueOverview.manualIncome)}
            </p>
          </section>
          <section className="card-soft p-5">
            <h2 className="mb-3 text-base font-bold">Expense Overview</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Today", demoExpenseOverview.today],
                ["Monthly", demoExpenseOverview.monthly],
                ["Annual", demoExpenseOverview.annual],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl bg-muted px-3 py-3">
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="font-bold">{money(Number(value))}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section>
          <h2 className="mb-3 text-base font-bold">Quick Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/finance/expenses">Add Expense</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/finance/revenue">Add Manual Income</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/finance/withdrawals">Review Withdrawals</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/finance/reports">View Reports</Link>
            </Button>
          </div>
        </section>

        <ScrollTable
          minWidthClassName="min-w-[52rem]"
          maxHeightClassName="max-h-[20rem]"
          toolbar={
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Pending Withdrawals</p>
              <Button asChild size="sm" variant="outline">
                <Link href="/finance/withdrawals">View all</Link>
              </Button>
            </div>
          }
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Instructor</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Payment Method</th>
              <th className="px-5 py-3 font-medium">Request Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {pending.map((w) => (
              <tr key={w.id} className="border-b border-border/70 hover:bg-accent/40">
                <td className="whitespace-nowrap px-5 py-4 font-semibold">
                  {w.instructor}
                </td>
                <td className="px-5 py-4">{money(w.amount)}</td>
                <td className="px-5 py-4">{w.paymentMethod}</td>
                <td className="px-5 py-4 text-muted-foreground">
                  {w.requestDate}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      financeStatusTone(w.status),
                    )}
                  >
                    {w.status}
                  </span>
                </td>
                <StickyActionCell>
                  <Button asChild size="sm">
                    <Link href={`/finance/withdrawals/${w.id}`}>Review</Link>
                  </Button>
                </StickyActionCell>
              </tr>
            ))}
          </tbody>
        </ScrollTable>

        <div className="grid gap-4 xl:grid-cols-2">
          <ScrollTable
            minWidthClassName="min-w-[40rem]"
            maxHeightClassName="max-h-[18rem]"
            toolbar={<p className="text-sm font-semibold">Recent Revenue</p>}
          >
            <ScrollTableHead>
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </ScrollTableHead>
            <tbody>
              {demoFinanceRevenue.slice(0, 4).map((r) => (
                <tr key={r.id} className="border-b border-border/70">
                  <td className="px-5 py-3 font-semibold">{r.student}</td>
                  <td className="max-w-[12rem] px-5 py-3">
                    <span className="line-clamp-1">{r.course}</span>
                  </td>
                  <td className="px-5 py-3">{money(r.amount)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </ScrollTable>

          <ScrollTable
            minWidthClassName="min-w-[28rem]"
            maxHeightClassName="max-h-[18rem]"
            toolbar={<p className="text-sm font-semibold">Recent Expenses</p>}
          >
            <ScrollTableHead>
              <tr>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </ScrollTableHead>
            <tbody>
              {demoFinanceExpenses.map((e) => (
                <tr key={e.id} className="border-b border-border/70">
                  <td className="px-5 py-3 font-semibold">{e.title}</td>
                  <td className="px-5 py-3">{money(e.amount)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.date}</td>
                </tr>
              ))}
            </tbody>
          </ScrollTable>
        </div>

        <section className="card-soft p-5">
          <h2 className="mb-4 text-base font-bold">Financial Summary</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demoFinanceChart}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => money(Number(value))}
                  contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }}
                />
                <Bar dataKey="value" fill="#002B5C" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </FinanceShell>
  );
}
