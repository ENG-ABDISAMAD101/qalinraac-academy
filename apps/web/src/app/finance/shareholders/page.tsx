"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  FinanceShell,
  financeStatusTone,
  money,
} from "@/components/finance/FinanceShell";
import { FinanceDownloadMenu } from "@/components/finance/FinanceDownloadMenu";
import { Input } from "@/components/ui/input";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import {
  financeShareholdersRequest,
  getApiErrorMessage,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type ShareholderRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  sharePercent: number;
  investment: number;
  status: string;
};

function asRows(items: Record<string, unknown>[]): ShareholderRow[] {
  return items.map((r) => ({
    id: String(r.id ?? ""),
    fullName: String(r.fullName ?? "—"),
    email: String(r.email ?? "—"),
    phone: String(r.phone ?? "—"),
    sharePercent: Number(r.sharePercent ?? 0),
    investment: Number(r.investment ?? 0),
    status: String(r.status ?? "—"),
  }));
}

export default function FinanceShareholdersPage() {
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rows, setRows] = useState<ShareholderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await financeShareholdersRequest(q.trim() || undefined);
      setRows(asRows(res.items));
      setTotal(res.total ?? res.items.length);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load shareholders."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q]);

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
        Name: r.fullName,
        Email: r.email,
        Phone: r.phone,
        "Share %": r.sharePercent,
        Investment: r.investment,
        Status: r.status,
      })),
    [rows],
  );

  return (
    <FinanceShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Shareholders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ownership distribution view (managed by Super Admin)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, phone…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{total} results</p>
            <FinanceDownloadMenu
              title="Shareholders"
              fileName="finance-shareholders"
              columns={[
                { key: "Name", label: "Name" },
                { key: "Email", label: "Email" },
                { key: "Phone", label: "Phone" },
                { key: "Share %", label: "Share %" },
                { key: "Investment", label: "Investment" },
                { key: "Status", label: "Status" },
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
          <PageLoader label="Loading shareholders" />
        ) : (
          <ScrollTable
            minWidthClassName="min-w-[52rem]"
            maxHeightClassName="max-h-[32rem]"
            toolbar={
              loading ? <Spinner className="sm" label="Updating" /> : null
            }
          >
            <ScrollTableHead>
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Share %</th>
                <th className="px-5 py-3 font-medium">Investment</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </ScrollTableHead>
            <tbody>
              {rows.length === 0 ? (
                <ScrollTableEmpty colSpan={6} message="No shareholders found" />
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/70 hover:bg-accent/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                      {r.fullName}
                    </td>
                    <td className="px-5 py-4">{r.email}</td>
                    <td className="px-5 py-4">{r.phone}</td>
                    <td className="px-5 py-4">{r.sharePercent}%</td>
                    <td className="px-5 py-4 font-semibold">
                      {money(r.investment)}
                    </td>
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
