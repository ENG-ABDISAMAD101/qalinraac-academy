"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Info } from "lucide-react";
import {
  FinanceShell,
  financeStatusTone,
  money,
} from "@/components/finance/FinanceShell";
import { formatFinanceDate } from "@/components/finance/FinanceDownloadMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFormActions,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { PageLoader } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  financeCompleteWithdrawalRequest,
  financeRejectWithdrawalRequest,
  financeWithdrawalRequest,
  getApiErrorMessage,
  mediaPublicUrl,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

type WithdrawalDetail = {
  id: string;
  instructor: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    phone: string;
  };
  courses: { id: string; title: string }[];
  students: number;
  amount: number;
  method: string;
  status: string;
  rawStatus: string;
  note: string;
  rejectionReason: string;
  requestedAt: string;
  accountDetails: {
    phone: string;
    email: string;
    method: string;
    note: string;
  };
  previousWithdrawals: {
    id: string;
    amount: number;
    method: string;
    status: string;
    date: string;
  }[];
  earnings: {
    total: number;
    platformShare: number;
    availableBalance: number;
    pendingWithdrawal: number;
    completedWithdrawal: number;
    sharePercent: number;
  };
  canApprove: boolean;
  insufficientBalance: boolean;
  insufficientMessage: string | null;
};

function parseDetail(raw: Record<string, unknown>): WithdrawalDetail {
  const instructor = (raw.instructor ?? {}) as Record<string, unknown>;
  const accountDetails = (raw.accountDetails ?? {}) as Record<string, unknown>;
  const earnings = (raw.earnings ?? {}) as Record<string, unknown>;
  const courses = Array.isArray(raw.courses)
    ? (raw.courses as Record<string, unknown>[]).map((c) => ({
        id: String(c.id ?? ""),
        title: String(c.title ?? "Course"),
      }))
    : [];
  const previousWithdrawals = Array.isArray(raw.previousWithdrawals)
    ? (raw.previousWithdrawals as Record<string, unknown>[]).map((p) => ({
        id: String(p.id ?? ""),
        amount: Number(p.amount ?? 0),
        method: String(p.method ?? "—"),
        status: String(p.status ?? ""),
        date: String(p.date ?? ""),
      }))
    : [];

  return {
    id: String(raw.id ?? ""),
    instructor: {
      id: String(instructor.id ?? ""),
      fullName: String(instructor.fullName ?? "Instructor"),
      email: String(instructor.email ?? ""),
      avatarUrl:
        typeof instructor.avatarUrl === "string"
          ? instructor.avatarUrl
          : undefined,
      phone: String(instructor.phone ?? ""),
    },
    courses,
    students: Number(raw.students ?? 0),
    amount: Number(raw.amount ?? 0),
    method: String(raw.method ?? "—"),
    status: String(raw.status ?? "Pending"),
    rawStatus: String(raw.rawStatus ?? ""),
    note: String(raw.note ?? ""),
    rejectionReason: String(raw.rejectionReason ?? ""),
    requestedAt: String(raw.requestedAt ?? ""),
    accountDetails: {
      phone: String(accountDetails.phone ?? "—"),
      email: String(accountDetails.email ?? "—"),
      method: String(accountDetails.method ?? "—"),
      note: String(accountDetails.note ?? "—"),
    },
    previousWithdrawals,
    earnings: {
      total: Number(earnings.total ?? 0),
      platformShare: Number(earnings.platformShare ?? 0),
      availableBalance: Number(earnings.availableBalance ?? 0),
      pendingWithdrawal: Number(earnings.pendingWithdrawal ?? 0),
      completedWithdrawal: Number(earnings.completedWithdrawal ?? 0),
      sharePercent: Number(earnings.sharePercent ?? 0),
    },
    canApprove: Boolean(raw.canApprove),
    insufficientBalance: Boolean(raw.insufficientBalance),
    insufficientMessage:
      typeof raw.insufficientMessage === "string"
        ? raw.insufficientMessage
        : null,
  };
}

const PROGRESS_MS = 60_000;

export default function FinanceWithdrawalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [data, setData] = useState<WithdrawalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [doneOpen, setDoneOpen] = useState(false);
  const [actionError, setActionError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await financeWithdrawalRequest(id);
      setData(parseDetail(res));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load withdrawal."));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function clearProgressTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function startProgress() {
    cancelledRef.current = false;
    setConfirmOpen(false);
    setProgressOpen(true);
    setProgress(0);
    setActionError("");
    const started = Date.now();
    clearProgressTimer();
    timerRef.current = setInterval(() => {
      if (cancelledRef.current) return;
      const elapsed = Date.now() - started;
      const pct = Math.min(100, Math.round((elapsed / PROGRESS_MS) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearProgressTimer();
        void finishComplete();
      }
    }, 200);
  }

  function cancelProgress() {
    cancelledRef.current = true;
    clearProgressTimer();
    setProgressOpen(false);
    setProgress(0);
  }

  async function finishComplete() {
    if (!id || cancelledRef.current) return;
    setCompleting(true);
    try {
      const res = await financeCompleteWithdrawalRequest(id);
      setData(parseDetail(res));
      setProgressOpen(false);
      setDoneOpen(true);
    } catch (err) {
      setActionError(
        getApiErrorMessage(err, "Could not complete withdrawal."),
      );
      setProgressOpen(false);
    } finally {
      setCompleting(false);
      setProgress(0);
    }
  }

  async function onReject() {
    if (!id || rejectReason.trim().length < 3) {
      setActionError("Enter a rejection reason (at least 3 characters).");
      return;
    }
    setRejecting(true);
    setActionError("");
    try {
      const res = await financeRejectWithdrawalRequest(id, rejectReason.trim());
      setData(parseDetail(res));
      setRejectOpen(false);
      setRejectReason("");
    } catch (err) {
      setActionError(getApiErrorMessage(err, "Could not reject withdrawal."));
    } finally {
      setRejecting(false);
    }
  }

  if (loading && !data) {
    return (
      <FinanceShell>
        <PageLoader label="Loading withdrawal" />
      </FinanceShell>
    );
  }

  if (error && !data) {
    return (
      <FinanceShell>
        <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm">
            <Link href="/finance/withdrawals">
              <ArrowLeft className="h-4 w-4" />
              Withdrawals
            </Link>
          </Button>
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        </div>
      </FinanceShell>
    );
  }

  if (!data) return null;

  const isPending =
    data.rawStatus === "pending" || data.status === "Pending";
  const canApprove = isPending && data.canApprove && !data.insufficientBalance;
  const name = data.instructor.fullName;

  return (
    <FinanceShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/finance/withdrawals">
              <ArrowLeft className="h-4 w-4" />
              Withdrawals
            </Link>
          </Button>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold",
              financeStatusTone(data.status),
            )}
          >
            {data.status}
          </span>
        </div>

        {data.insufficientBalance && data.insufficientMessage ? (
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{data.insufficientMessage}</p>
          </div>
        ) : null}

        {actionError ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {actionError}
          </p>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="card-soft space-y-5 p-6">
            <h2 className="text-base font-bold text-primary dark:text-foreground">
              Instructor
            </h2>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 border border-border">
                <AvatarImage
                  src={mediaPublicUrl(data.instructor.avatarUrl)}
                  alt={name}
                />
                <AvatarFallback className="font-bold text-primary">
                  {initialsFromName(name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-1">
                <p className="font-display text-xl font-bold">{name}</p>
                <p className="text-sm text-muted-foreground">
                  {data.instructor.email || "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.instructor.phone || "—"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Courses
              </p>
              {data.courses.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No courses</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {data.courses.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-xl bg-muted/70 px-3 py-2 text-sm font-medium"
                    >
                      {c.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl bg-canvas px-4 py-3 dark:bg-muted/40">
              <p className="text-xs text-muted-foreground">Students</p>
              <p className="text-2xl font-bold text-primary dark:text-foreground">
                {data.students}
              </p>
            </div>
          </section>

          <section className="card-soft space-y-5 p-6">
            <h2 className="text-base font-bold text-primary dark:text-foreground">
              Withdrawal
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Requested amount</dt>
                <dd className="mt-1 text-2xl font-bold">{money(data.amount)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Payment method</dt>
                <dd className="mt-1 text-lg font-semibold">{data.method}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Requested</dt>
                <dd className="mt-1 font-medium">
                  {formatFinanceDate(data.requestedAt)}
                </dd>
              </div>
            </dl>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Account details
              </p>
              <div className="mt-2 grid gap-2 rounded-2xl border border-border/70 px-4 py-3 text-sm sm:grid-cols-2">
                <p>
                  <span className="text-muted-foreground">Phone · </span>
                  {data.accountDetails.phone}
                </p>
                <p>
                  <span className="text-muted-foreground">Email · </span>
                  {data.accountDetails.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Method · </span>
                  {data.accountDetails.method}
                </p>
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">Note · </span>
                  {data.accountDetails.note}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Previous withdrawals
              </p>
              {data.previousWithdrawals.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">None yet</p>
              ) : (
                <ul className="mt-2 divide-y divide-border/70 rounded-2xl border border-border/70">
                  {data.previousWithdrawals.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                    >
                      <span className="font-semibold">{money(p.amount)}</span>
                      <span className="text-muted-foreground">{p.method}</span>
                      <span className="text-muted-foreground">
                        {formatFinanceDate(p.date)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="card-soft px-5 py-4">
            <p className="text-xs text-muted-foreground">Earnings</p>
            <p className="mt-1 text-xl font-bold">{money(data.earnings.total)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {data.earnings.sharePercent}% share
            </p>
          </div>
          <div className="card-soft px-5 py-4">
            <p className="text-xs text-muted-foreground">Platform share</p>
            <p className="mt-1 text-xl font-bold">
              {money(data.earnings.platformShare)}
            </p>
          </div>
          <div className="card-soft px-5 py-4">
            <p className="text-xs text-muted-foreground">Available balance</p>
            <p className="mt-1 text-xl font-bold">
              {money(data.earnings.availableBalance)}
            </p>
          </div>
        </div>

        {data.rejectionReason ? (
          <p className="rounded-2xl border border-border/70 bg-muted/40 px-4 py-3 text-sm">
            <span className="font-semibold">Rejection reason: </span>
            {data.rejectionReason}
          </p>
        ) : null}

        {isPending ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!canApprove}
              title={
                data.insufficientBalance
                  ? "Available balance is less than the requested amount"
                  : undefined
              }
              onClick={() => setConfirmOpen(true)}
            >
              Approve
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(true)}
            >
              Reject
            </Button>
          </div>
        ) : null}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Are you sure you have sent money to {name}?
            </DialogTitle>
            <DialogDescription>
              Confirm only after the payout has been sent to the instructor.
              This will mark the withdrawal as completed.
            </DialogDescription>
          </DialogHeader>
          <DialogFormActions
            showHelp={false}
            cancelLabel="Cancel"
            confirmLabel="Continue"
            confirmType="button"
            onCancel={() => setConfirmOpen(false)}
            onConfirm={startProgress}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={progressOpen}
        onOpenChange={(open) => {
          if (!open && !completing) cancelProgress();
        }}
      >
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Processing withdrawal</DialogTitle>
            <DialogDescription>
              Completing payout for {name}. You can cancel before it finishes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Progress value={progress} />
            <p className="text-center text-sm text-muted-foreground">
              {completing ? "Finalizing…" : `${progress}%`}
            </p>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={completing || progress >= 100}
              onClick={cancelProgress}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={doneOpen} onOpenChange={setDoneOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Withdrawal completed</DialogTitle>
            <DialogDescription>
              Payment for {name} has been marked as completed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setDoneOpen(false)}>
              Done
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/finance/withdrawals")}
            >
              Back to list
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject withdrawal</DialogTitle>
            <DialogDescription>
              The instructor will be notified with your reason.
            </DialogDescription>
          </DialogHeader>
          <FormField label="Reason" htmlFor="reject-reason">
            <Textarea
              id="reject-reason"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this request cannot be paid"
            />
          </FormField>
          <DialogFormActions
            showHelp={false}
            confirmLabel="Reject"
            confirmType="button"
            confirmLoading={rejecting}
            onCancel={() => setRejectOpen(false)}
            onConfirm={() => void onReject()}
          />
        </DialogContent>
      </Dialog>
    </FinanceShell>
  );
}
