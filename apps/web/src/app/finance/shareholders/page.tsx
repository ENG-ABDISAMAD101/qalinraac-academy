"use client";

import {
  FinanceShell,
  financeStatusTone,
  money,
} from "@/components/finance/FinanceShell";
import {
  ScrollTable,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { demoShareholders } from "@/lib/finance-demo-data";
import { cn } from "@/lib/utils";

export default function FinanceShareholdersPage() {
  return (
    <FinanceShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Shareholders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created by Super Admin only — Finance manages distribution view
          </p>
        </div>
        <ScrollTable
          minWidthClassName="min-w-[48rem]"
          toolbar={
            <p className="text-sm font-semibold">
              Profit distribution ({demoShareholders.length})
            </p>
          }
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Shareholder Name</th>
              <th className="px-5 py-3 font-medium">Share %</th>
              <th className="px-5 py-3 font-medium">Current Profit</th>
              <th className="px-5 py-3 font-medium">Distribution Status</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {demoShareholders.map((s) => (
              <tr
                key={s.id}
                className="border-b border-border/70 hover:bg-accent/40"
              >
                <td className="whitespace-nowrap px-5 py-4 font-semibold">
                  {s.name}
                </td>
                <td className="px-5 py-4">{s.sharePercent}%</td>
                <td className="px-5 py-4">{money(s.currentProfit)}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      financeStatusTone(s.distributionStatus),
                    )}
                  >
                    {s.distributionStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </FinanceShell>
  );
}
