"use client";

import { FinanceShell, money } from "@/components/finance/FinanceShell";
import {
  ScrollTable,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import {
  demoFinanceReports,
  demoInstructorPayments,
  demoShareholders,
} from "@/lib/finance-demo-data";

export default function FinanceReportsPage() {
  const { revenue, expenses, profit } = demoFinanceReports;

  return (
    <FinanceShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Financial Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue, expenses, profit, instructor payments, shareholders
          </p>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-bold">Revenue report</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Daily", revenue.daily],
              ["Weekly", revenue.weekly],
              ["Monthly", revenue.monthly],
              ["Annual", revenue.annual],
            ].map(([label, value]) => (
              <div key={String(label)} className="card-soft px-5 py-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">
                  {money(Number(value))}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold">Expense report</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Daily", expenses.daily],
              ["Monthly", expenses.monthly],
              ["Annual", expenses.annual],
            ].map(([label, value]) => (
              <div key={String(label)} className="card-soft px-5 py-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-bold">
                  {money(Number(value))}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="card-soft p-6">
          <h2 className="mb-3 text-lg font-bold">Profit report</h2>
          <p className="text-sm text-muted-foreground">
            Revenue − Expenses = Net Profit
          </p>
          <p className="mt-3 text-2xl font-bold text-brand-navy dark:text-foreground">
            {money(profit.revenue)} − {money(profit.expenses)} ={" "}
            {money(profit.net)}
          </p>
        </section>

        <ScrollTable
          minWidthClassName="min-w-[48rem]"
          maxHeightClassName="max-h-[22rem]"
          toolbar={
            <p className="text-sm font-semibold">Instructor payment report</p>
          }
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Instructor</th>
              <th className="px-5 py-3 font-medium">Earnings</th>
              <th className="px-5 py-3 font-medium">Withdrawals</th>
              <th className="px-5 py-3 font-medium">Balance</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoInstructorPayments.map((p) => (
              <tr key={p.id} className="border-b border-border/70">
                <td className="px-5 py-4 font-semibold">{p.instructor}</td>
                <td className="px-5 py-4">{money(p.totalEarnings)}</td>
                <td className="px-5 py-4">{money(p.totalWithdrawn)}</td>
                <td className="px-5 py-4">{money(p.availableBalance)}</td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>

        <ScrollTable
          minWidthClassName="min-w-[40rem]"
          maxHeightClassName="max-h-[22rem]"
          toolbar={<p className="text-sm font-semibold">Shareholder report</p>}
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Shareholder</th>
              <th className="px-5 py-3 font-medium">Share %</th>
              <th className="px-5 py-3 font-medium">Profit distribution</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoShareholders.map((s) => (
              <tr key={s.id} className="border-b border-border/70">
                <td className="px-5 py-4 font-semibold">{s.name}</td>
                <td className="px-5 py-4">{s.sharePercent}%</td>
                <td className="px-5 py-4">
                  {money(s.currentProfit)} · {s.distributionStatus}
                </td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </FinanceShell>
  );
}
