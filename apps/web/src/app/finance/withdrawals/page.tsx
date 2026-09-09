"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Info, Search } from "lucide-react";
import {
  FinanceShell,
  financeStatusTone,
  money,
} from "@/components/finance/FinanceShell";
import {
  FinanceDownloadMenu,
  formatFinanceDate,
} from "@/components/finance/FinanceDownloadMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import {
  financeWithdrawalsRequest,
  getApiErrorMessage,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
] as const;

type WithdrawalRow = {
  id: string;
  instructor: string;
  amount: number;
  method: string;
  status: string;
  requestedAt: string;
  insufficientBalance: boolean;
  canApprove: boolean;
};

function asRows(items: Record<string, unknown>[]): WithdrawalRow[] {
  return items.map((r) => ({
    id: String(r.id ?? ""),
    instructor: String(r.instructor ?? "Instructor"),
    amount: Number(r.amount ?? 0),
    method: String(r.method ?? r.paymentMethod ?? "—"),
    status: String(r.status ?? "Pending"),
    requestedAt: String(r.requestedAt ?? ""),
    insufficientBalance: Boolean(r.insufficientBalance),
    canApprove: Boolean(r.canApprove),
  }));
}

export default function FinanceWithdrawalsPage() {
  const [status, setStatus] = useState<string>("all");
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await financeWithdrawalsRequest({
        status,
        q: q.trim() || undefined,
      });
      setRows(asRows(res.items));
      setTotal(res.total ?? res.items.length);
      setStats({
        pending: res.stats?.pending ?? 0,
        completed: res.stats?.completed ?? 0,
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load withdrawals."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [status, q]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const downloadRows = useMemo(
    () =>
      rows.map((r) => ({
        Instructor: r.instructor,
        Amount: r.amount,
        Method: r.method,
        Status: r.status,
        Date: formatFinanceDate(r.requestedAt),
      })),
    [rows],
  );

  return (
    <FinanceShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Withdrawals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and complete instructor payout requests
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card-soft px-5 py-4">
            <p className="text-xs font-medium text-muted-foreground">Pending</p>
            <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
              {stats.pending}
            </p>
          </div>
          <div className="card-soft px-5 py-4">
            <p className="text-xs font-medium text-muted-foreground">
              Completed
            </p>
            <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
              {stats.completed}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                status === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search instructor, method…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{total} results</p>
            <FinanceDownloadMenu
              title="Withdrawals"
              fileName="finance-withdrawals"
              columns={[
                { key: "Instructor", label: "Instructor" },
                { key: "Amount", label: "Amount" },
                { key: "Method", label: "Method" },
                { key: "Status", label: "Status" },
                { key: "Date", label: "Date" },
              ]}
              rows={downloadRows}
            />
          </div>
        </div>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading && rows.length === 0 ? (
          <PageLoader label="Loading withdrawals" />
        ) : (
          <ScrollTable
            minWidthClassName="min-w-[56rem]"
            maxHeightClassName="max-h-[32rem]"
            toolbar={
              loading ? <Spinner className="sm" label="Updating" /> : null
            }
          >
            <ScrollTableHead>
              <tr>
                <th className="px-5 py-3 font-medium">Instructor</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Requested</th>
                <StickyActionHead />
              </tr>
            </ScrollTableHead>
            <tbody>
              {rows.length === 0 ? (
                <ScrollTableEmpty colSpan={6} message="No withdrawals found" />
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/70 hover:bg-accent/40"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{r.instructor}</span>
                        {r.insufficientBalance ? (
                          <span
                            className="inline-flex text-amber-700 dark:text-amber-300"
                            title="Available balance is less than the requested amount. Approve is disabled until the instructor’s balance covers this withdrawal."
                          >
                            <Info className="h-4 w-4" aria-label="Insufficient balance" />
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold">{money(r.amount)}</td>
                    <td className="px-5 py-4">{r.method}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold",
                          financeStatusTone(r.status),
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatFinanceDate(r.requestedAt)}
                    </td>
                    <StickyActionCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/finance/withdrawals/${r.id}`}>View</Link>
                      </Button>
                    </StickyActionCell>
                  </tr>
                ))
              )}
            </tbody>
          </ScrollTable>
        )}
      </div>
    </FinanceShell>
  );
}
