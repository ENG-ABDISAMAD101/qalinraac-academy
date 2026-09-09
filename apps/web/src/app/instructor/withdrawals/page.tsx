"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  InstructorShell,
  statusTone,
} from "@/components/instructor/InstructorShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  formatMoney,
  getApiErrorMessage,
  instructorCreateWithdrawalRequest,
  instructorWithdrawalsRequest,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type WithdrawalsData = Awaited<
  ReturnType<typeof instructorWithdrawalsRequest>
>;

type PaymentMethod = "waafi" | "evc_plus" | "zaad" | "bank_transfer";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "waafi", label: "Waafi" },
  { value: "evc_plus", label: "EVC Plus" },
  { value: "zaad", label: "Zaad" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

function paymentMethodLabel(method?: string) {
  return (
    PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method ?? "—"
  );
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Pending",
    approved: "Approved",
    completed: "Completed",
    rejected: "Rejected",
  };
  return map[status.toLowerCase()] ?? status;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function InstructorWithdrawalsPage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<WithdrawalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError("");
    try {
      setData(await instructorWithdrawalsRequest(query));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load withdrawals."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void load(q.trim() || undefined);
    }, 300);
    return () => clearTimeout(t);
  }, [q, load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    const dollars = Number(amount);
    if (!amount.trim() || Number.isNaN(dollars) || dollars <= 0) {
      setFormError("Enter a valid amount.");
      return;
    }
    if (!paymentMethod) {
      setFormError("Select a payment method.");
      return;
    }
    const amountCents = Math.round(dollars * 100);
    if (data && amountCents > data.availableBalance) {
      setFormError("Amount exceeds available balance.");
      return;
    }
    setSubmitting(true);
    try {
      await instructorCreateWithdrawalRequest({
        amountCents,
        paymentMethod,
        note: note.trim() || undefined,
      });
      setAmount("");
      setPaymentMethod("");
      setNote("");
      setFormSuccess("Withdrawal request submitted for Finance review.");
      await load(q.trim() || undefined);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not request withdrawal."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InstructorShell>
      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Withdrawals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Available balance:{" "}
            {loading ? "…" : formatMoney(data?.availableBalance ?? 0)}
          </p>

          <form onSubmit={onSubmit} className="mt-6 card-soft space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                required
                type="number"
                min={0.01}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment method</Label>
              <select
                id="paymentMethod"
                required
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as PaymentMethod | "")
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="" disabled>
                  Select payment method
                </option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note for Finance"
              />
            </div>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            {formSuccess ? (
              <p className="rounded-2xl bg-brand-lime-soft px-4 py-3 text-sm font-medium text-brand-navy">
                {formSuccess}
              </p>
            ) : null}
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <Spinner className="sm on-primary" label="Submitting" />
              ) : null}
              Request Withdrawal
            </Button>
          </form>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-bold text-brand-navy dark:text-foreground">
              History
            </h2>
            <label className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="pl-10"
              />
            </label>
          </div>

          {loading ? (
            <div className="flex min-h-[12rem] items-center justify-center">
              <Spinner label="Loading withdrawals" />
            </div>
          ) : error ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : (data?.items.length ?? 0) === 0 ? (
            <div className="card-soft px-5 py-12 text-center text-sm text-muted-foreground">
              No withdrawal requests yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {data!.items.map((w) => {
                const label = statusLabel(w.status);
                return (
                  <li key={w.id} className="card-soft p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">
                        {formatMoney(w.amountCents, w.currency)}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold",
                          statusTone(label),
                        )}
                      >
                        {label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {paymentMethodLabel(w.paymentMethod)}
                    </p>
                    {w.note ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {w.note}
                      </p>
                    ) : null}
                    {w.rejectionReason ? (
                      <p className="mt-1 text-sm text-red-600">
                        {w.rejectionReason}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(w.createdAt)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </InstructorShell>
  );
}
