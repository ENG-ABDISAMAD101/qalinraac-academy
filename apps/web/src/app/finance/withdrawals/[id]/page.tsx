"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  FinanceShell,
  financeStatusTone,
  money,
} from "@/components/finance/FinanceShell";
import { Button } from "@/components/ui/button";
import { demoFinanceWithdrawals } from "@/lib/finance-demo-data";
import { cn } from "@/lib/utils";

export default function FinanceWithdrawalReviewPage() {
  const params = useParams<{ id: string }>();
  const item =
    demoFinanceWithdrawals.find((w) => w.id === params.id) ??
    demoFinanceWithdrawals[0];
  const [reason, setReason] = useState("");
  const [result, setResult] = useState<string | null>(null);

  return (
    <FinanceShell>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/finance/withdrawals">← Withdrawals</Link>
        </Button>
        <div className="card-soft space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-2xl font-bold text-brand-navy dark:text-foreground">
              Withdrawal review
            </h1>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                financeStatusTone(item.status),
              )}
            >
              {item.status}
            </span>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Instructor</dt>
              <dd className="font-semibold">{item.instructor}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Requested amount</dt>
              <dd className="font-semibold">{money(item.amount)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Available balance</dt>
              <dd className="font-semibold">{money(item.availableBalance)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Payment method</dt>
              <dd className="font-semibold">{item.paymentMethod}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Account details</dt>
              <dd className="font-semibold">{item.accountDetails}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Previous withdrawals</dt>
              <dd className="font-semibold">{item.previousWithdrawals}</dd>
            </div>
          </dl>
          <label className="block text-sm font-medium">
            Rejection reason
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
              placeholder="Required when rejecting"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-brand-lime text-brand-navy hover:bg-brand-lime/90"
              onClick={() =>
                setResult("Approved → Payment Processed → Completed")
              }
            >
              Approve
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                setResult(
                  reason
                    ? "Rejected — instructor notified"
                    : "Add a rejection reason first",
                )
              }
            >
              Reject
            </Button>
          </div>
          {result ? (
            <p className="text-sm font-medium text-brand-navy dark:text-brand-lime">
              {result}
            </p>
          ) : null}
        </div>
      </div>
    </FinanceShell>
  );
}
