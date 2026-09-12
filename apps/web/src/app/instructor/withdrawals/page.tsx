"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import {
  InstructorShell,
  statusTone,
} from "@/components/instructor/InstructorShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formSelectClassName } from "@/components/ui/form";
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

function formatDateTime(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InstructorWithdrawalsPage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<WithdrawalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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

  function resetForm() {
    setAmount("");
    setPaymentMethod("");
    setNote("");
    setFormError("");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
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
      resetForm();
      setCreateOpen(false);
      await load(q.trim() || undefined);
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not request withdrawal."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InstructorShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Withdrawals
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Balance:{" "}
              {loading ? "…" : formatMoney(data?.availableBalance ?? 0)}{" "}
              (your share after platform fee)
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              resetForm();
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Request Withdrawal
          </Button>
        </div>

        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search withdrawals"
            className="pl-11"
          />
        </label>

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
              const open = openId === w.id;
              return (
                <li
                  key={w.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 p-4 text-left sm:p-5"
                    onClick={() => setOpenId(open ? null : w.id)}
                    aria-expanded={open}
                  >
                    <div className="min-w-0 space-y-2">
                      <p className="text-base font-bold text-foreground">
                        Withdrawal
                      </p>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                          statusTone(label),
                        )}
                      >
                        {label}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(w.createdAt)}
                      </p>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border">
                      {open ? (
                        <X className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </span>
                  </button>

                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-200",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-3 border-t border-border px-4 pb-5 pt-4 sm:px-5">
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Amount
                          </p>
                          <p className="mt-1 text-lg font-bold text-foreground">
                            {formatMoney(w.amountCents, w.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Description
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {w.note?.trim() ||
                              `${paymentMethodLabel(w.paymentMethod)} withdrawal`}
                          </p>
                        </div>
                        {w.rejectionReason ? (
                          <p className="text-sm text-destructive">
                            {w.rejectionReason}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request withdrawal</DialogTitle>
            <DialogDescription>
              Available balance: {formatMoney(data?.availableBalance ?? 0)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
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
                className={formSelectClassName}
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
              <Label htmlFor="note">Description (optional)</Label>
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Spinner className="sm on-primary" label="Submitting" />
                ) : null}
                Submit request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </InstructorShell>
  );
}
