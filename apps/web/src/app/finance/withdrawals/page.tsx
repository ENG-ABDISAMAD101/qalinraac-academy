"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FinanceShell,
  financeStatusTone,
  money,
} from "@/components/finance/FinanceShell";
import { Button } from "@/components/ui/button";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import { demoFinanceWithdrawals } from "@/lib/finance-demo-data";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Pending", "Approved", "Rejected", "Completed"] as const;

export default function FinanceWithdrawalsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const rows = useMemo(() => {
    if (filter === "All") return demoFinanceWithdrawals;
    return demoFinanceWithdrawals.filter((w) => w.status === filter);
  }, [filter]);

  return (
    <FinanceShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Withdrawals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Instructor requests reviewed by Finance
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3.5 py-2 text-xs font-semibold",
                filter === f
                  ? "bg-brand-navy text-white dark:bg-brand-lime dark:text-brand-navy"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <ScrollTable
          minWidthClassName="min-w-[56rem]"
          toolbar={
            <div className="flex justify-between gap-3 text-sm">
              <p className="font-semibold">Withdrawal queue</p>
              <p className="text-xs text-muted-foreground">
                {rows.length} result{rows.length === 1 ? "" : "s"}
              </p>
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
            {rows.length === 0 ? (
              <ScrollTableEmpty colSpan={6} />
            ) : (
              rows.map((w) => (
                <tr
                  key={w.id}
                  className="border-b border-border/70 hover:bg-accent/40"
                >
                  <td className="whitespace-nowrap px-5 py-4 font-semibold">
                    {w.instructor}
                  </td>
                  <td className="px-5 py-4">{money(w.amount)}</td>
                  <td className="px-5 py-4">{w.paymentMethod}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
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
              ))
            )}
          </tbody>
        </ScrollTable>
      </div>
    </FinanceShell>
  );
}
