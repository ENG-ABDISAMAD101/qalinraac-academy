"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
import { formatFinanceDate } from "@/components/finance/FinanceDownloadMenu";
import { Button } from "@/components/ui/button";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import {
  financeDashboardRequest,
  getApiErrorMessage,
  type FinanceDashboardData,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type PendingRow = {
  id: string;
  instructor: string;
  amount: number;
  method: string;
  status: string;
  requestedAt?: string;
};

function asPending(rows: Array<Record<string, unknown>>): PendingRow[] {
  return rows.map((r) => ({
    id: String(r.id ?? ""),
    instructor: String(r.instructor ?? "Instructor"),
    amount: Number(r.amount ?? 0),
    method: String(r.method ?? r.paymentMethod ?? "—"),
    status: String(r.status ?? "Pending"),
    requestedAt:
      typeof r.requestedAt === "string"
        ? r.requestedAt
        : typeof r.requestDate === "string"
          ? r.requestDate
          : undefined,
  }));
}

export default function FinanceDashboardPage() {
  const [data, setData] = useState<FinanceDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await financeDashboardRequest();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(err, "Could not load finance dashboard."),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !data) {
    return (
      <FinanceShell>
        <PageLoader label="Loading finance dashboard" />
      </FinanceShell>
    );
  }

  if (error && !data) {
    return (
      <FinanceShell>
        <div className="px-4 py-10 sm:px-6 lg:px-8">
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        </div>
      </FinanceShell>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Total Revenue", value: money(data.stats.totalRevenue) },
    { label: "Total Expenses", value: money(data.stats.totalExpenses) },
    { label: "Net Profit", value: money(data.stats.netProfit) },
    {
      label: "Pending Withdrawals",
      value: data.stats.pendingWithdrawals,
    },
    {
      label: "Total Instructor Payments",
      value: money(data.stats.totalInstructorPayments),
    },
  ];

  const pending = asPending(data.pendingWithdrawals);

  return (
    <FinanceShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Finance Control Center
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Revenue, expenses, withdrawals, and distributions
            </p>
          </div>
          {loading ? <Spinner className="sm" label="Refreshing" /> : null}
        </div>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="card-soft px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="card-soft p-5">
            <h2 className="mb-3 text-base font-bold">Revenue Overview</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["Today", data.revenueOverview.today],
                  ["Weekly", data.revenueOverview.weekly],
                  ["Monthly", data.revenueOverview.monthly],
                  ["Annual", data.revenueOverview.annual],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-muted px-3 py-3">
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="font-bold">{money(value)}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="card-soft p-5">
            <h2 className="mb-3 text-base font-bold">Expense Overview</h2>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  ["Today", data.expenseOverview.today],
                  ["Monthly", data.expenseOverview.monthly],
                  ["Annual", data.expenseOverview.annual],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-muted px-3 py-3">
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                  <p className="font-bold">{money(value)}</p>
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
            {pending.length === 0 ? (
              <ScrollTableEmpty colSpan={6} message="No pending withdrawals" />
            ) : (
              pending.map((w) => (
                <tr
                  key={w.id}
                  className="border-b border-border/70 hover:bg-accent/40"
                >
                  <td className="whitespace-nowrap px-5 py-4 font-semibold">
                    {w.instructor}
                  </td>
                  <td className="px-5 py-4">{money(w.amount)}</td>
                  <td className="px-5 py-4">{w.method}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatFinanceDate(w.requestedAt)}
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
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/finance/withdrawals/${w.id}`}>View</Link>
                    </Button>
                  </StickyActionCell>
                </tr>
              ))
            )}
          </tbody>
        </ScrollTable>

        <section className="card-soft p-5">
          <h2 className="mb-4 text-base font-bold">Financial Summary</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6B7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value) => money(Number(value))}
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    fontSize: 12,
                  }}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#111827"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#6B7280"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </FinanceShell>
  );
}
