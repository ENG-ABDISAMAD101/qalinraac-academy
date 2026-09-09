"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FinanceShell, money } from "@/components/finance/FinanceShell";
import {
  FinanceDownloadMenu,
  formatFinanceDate,
} from "@/components/finance/FinanceDownloadMenu";
import { Input } from "@/components/ui/input";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { financeReportsRequest, getApiErrorMessage } from "@/lib/api";

type ReportSummary = {
  income: number;
  expense: number;
  withdraw: number;
  studentCourseSales: number;
  balance: number;
  instructorPayments: number;
};

type ChartPoint = { label: string; revenue: number; expenses: number };
type BreakdownPoint = { label: string; value: number };

type TableRow = {
  id: string;
  type: string;
  party: string;
  detail: string;
  method: string;
  amount: number;
  date: string;
};

const BREAKDOWN_COLORS = [
  "#111827",
  "#6B7280",
  "#9CA3AF",
  "#E5E7EB",
  "#111827",
];

function parseTable(items: unknown): TableRow[] {
  if (!Array.isArray(items)) return [];
  return (items as Record<string, unknown>[]).map((r) => ({
    id: String(r.id ?? ""),
    type: String(r.type ?? "—"),
    party: String(r.party ?? "—"),
    detail: String(r.detail ?? "—"),
    method: String(r.method ?? "—"),
    amount: Number(r.amount ?? 0),
    date: String(r.date ?? ""),
  }));
}

export default function FinanceReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownPoint[]>([]);
  const [table, setTable] = useState<TableRow[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await financeReportsRequest();
        if (cancelled) return;
        const s = (res.summary ?? {}) as Record<string, unknown>;
        setSummary({
          income: Number(s.income ?? 0),
          expense: Number(s.expense ?? 0),
          withdraw: Number(s.withdraw ?? 0),
          studentCourseSales: Number(s.studentCourseSales ?? 0),
          balance: Number(s.balance ?? 0),
          instructorPayments: Number(s.instructorPayments ?? 0),
        });
        setChart(
          Array.isArray(res.chart)
            ? (res.chart as ChartPoint[]).map((c) => ({
                label: String(c.label ?? ""),
                revenue: Number(c.revenue ?? 0),
                expenses: Number(c.expenses ?? 0),
              }))
            : [],
        );
        setBreakdown(
          Array.isArray(res.breakdown)
            ? (res.breakdown as Record<string, unknown>[]).map((b) => ({
                label: String(b.label ?? ""),
                value: Number(b.value ?? 0),
              }))
            : [],
        );
        setTable(parseTable(res.table));
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load finance reports."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const filtered = useMemo(() => {
    if (!q.trim()) return table;
    const needle = q.trim().toLowerCase();
    return table.filter(
      (r) =>
        r.type.toLowerCase().includes(needle) ||
        r.party.toLowerCase().includes(needle) ||
        r.detail.toLowerCase().includes(needle) ||
        r.method.toLowerCase().includes(needle),
    );
  }, [table, q]);

  const downloadRows = useMemo(
    () =>
      filtered.map((r) => ({
        Type: r.type,
        Party: r.party,
        Detail: r.detail,
        Method: r.method,
        Amount: r.amount,
        Date: formatFinanceDate(r.date),
      })),
    [filtered],
  );

  if (loading && !summary) {
    return (
      <FinanceShell>
        <PageLoader label="Loading finance reports" />
      </FinanceShell>
    );
  }

  if (error && !summary) {
    return (
      <FinanceShell>
        <div className="px-4 py-10 sm:px-6 lg:px-8">
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        </div>
      </FinanceShell>
    );
  }

  const cards = summary
    ? [
        { label: "Total income", value: money(summary.income) },
        { label: "Total expenses", value: money(summary.expense) },
        { label: "Withdrawals paid", value: money(summary.withdraw) },
        {
          label: "Student course sales",
          value: money(summary.studentCourseSales),
        },
        { label: "Net balance", value: money(summary.balance) },
        {
          label: "Instructor payments",
          value: money(summary.instructorPayments),
        },
      ]
    : [];

  return (
    <FinanceShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Financial Reports
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete ledger across income, expenses, withdrawals, and shares
            </p>
          </div>
          {loading ? <Spinner className="sm" label="Refreshing" /> : null}
        </div>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="card-soft px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground">
                {c.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
                {c.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="card-soft p-5">
            <h2 className="mb-4 text-base font-bold">Revenue vs expenses</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    formatter={(value) => money(Number(value))}
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="revenue"
                    name="Revenue"
                    fill="#111827"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#6B7280"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card-soft p-5">
            <h2 className="mb-4 text-base font-bold">Breakdown</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={120}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => money(Number(value))}
                    contentStyle={{
                      borderRadius: 12,
                      border: "none",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" name="Amount" radius={[0, 6, 6, 0]}>
                    {breakdown.map((_, i) => (
                      <Cell
                        key={i}
                        fill={BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search type, party, detail, method…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {filtered.length} results
            </p>
            <FinanceDownloadMenu
              title="Finance Report Ledger"
              fileName="finance-reports"
              columns={[
                { key: "Type", label: "Type" },
                { key: "Party", label: "Party" },
                { key: "Detail", label: "Detail" },
                { key: "Method", label: "Method" },
                { key: "Amount", label: "Amount" },
                { key: "Date", label: "Date" },
              ]}
              rows={downloadRows}
            />
          </div>
        </div>

        <ScrollTable
          minWidthClassName="min-w-[64rem]"
          maxHeightClassName="max-h-[28rem]"
          toolbar={<p className="text-sm font-semibold">Full ledger</p>}
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Party</th>
              <th className="px-5 py-3 font-medium">Detail</th>
              <th className="px-5 py-3 font-medium">Method</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Date</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {filtered.length === 0 ? (
              <ScrollTableEmpty colSpan={6} message="No report rows found" />
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border/70 hover:bg-accent/40"
                >
                  <td className="whitespace-nowrap px-5 py-4 font-semibold">
                    {r.type}
                  </td>
                  <td className="px-5 py-4">{r.party}</td>
                  <td className="max-w-[16rem] px-5 py-4">
                    <span className="line-clamp-1">{r.detail}</span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{r.method}</td>
                  <td className="px-5 py-4 font-semibold">{money(r.amount)}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatFinanceDate(r.date)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </ScrollTable>
      </div>
    </FinanceShell>
  );
}
