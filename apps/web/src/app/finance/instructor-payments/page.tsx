"use client";

import { FinanceShell, money } from "@/components/finance/FinanceShell";
import {
  ScrollTable,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { demoInstructorPayments } from "@/lib/finance-demo-data";

export default function FinanceInstructorPaymentsPage() {
  return (
    <FinanceShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Instructor Payments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only — auto-calculated from successful purchases
          </p>
        </div>
        <ScrollTable
          minWidthClassName="min-w-[52rem]"
          toolbar={
            <p className="text-sm font-semibold">
              Earnings snapshot ({demoInstructorPayments.length})
            </p>
          }
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Instructor</th>
              <th className="px-5 py-3 font-medium">Total Earnings</th>
              <th className="px-5 py-3 font-medium">Available Balance</th>
              <th className="px-5 py-3 font-medium">Pending Balance</th>
              <th className="px-5 py-3 font-medium">Total Withdrawn</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoInstructorPayments.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border/70 hover:bg-accent/40"
              >
                <td className="whitespace-nowrap px-5 py-4 font-semibold">
                  {p.instructor}
                </td>
                <td className="px-5 py-4">{money(p.totalEarnings)}</td>
                <td className="px-5 py-4">{money(p.availableBalance)}</td>
                <td className="px-5 py-4">{money(p.pendingBalance)}</td>
                <td className="px-5 py-4">{money(p.totalWithdrawn)}</td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </FinanceShell>
  );
}
