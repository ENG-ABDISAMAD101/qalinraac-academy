"use client";

import { FormEvent, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FinanceShell, money } from "@/components/finance/FinanceShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { demoFinanceRevenue } from "@/lib/finance-demo-data";
import { cn } from "@/lib/utils";

const PERIODS = ["All", "Today", "Weekly", "Monthly", "Annual"] as const;
const METHODS = ["All", "Stripe", "Waafi", "Bank Transfer"] as const;

export default function FinanceRevenuePage() {
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("All");
  const [method, setMethod] = useState<(typeof METHODS)[number]>("All");
  const [showManual, setShowManual] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [saved, setSaved] = useState(false);

  const rows = useMemo(() => {
    let list = [...demoFinanceRevenue];
    if (method !== "All") list = list.filter((r) => r.paymentMethod === method);
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.student.toLowerCase().includes(needle) ||
          r.course.toLowerCase().includes(needle) ||
          r.instructor.toLowerCase().includes(needle),
      );
    }
    return list;
  }, [q, method]);

  function onManual(e: FormEvent) {
    e.preventDefault();
    setSaved(true);
    setShowManual(false);
  }

  return (
    <FinanceShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              Revenue
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Course sales + manual income
            </p>
          </div>
          <Button type="button" onClick={() => setShowManual((v) => !v)}>
            Add Manual Income
          </Button>
        </div>

        {showManual ? (
          <form onSubmit={onManual} className="card-soft max-w-xl space-y-4 p-6">
            <h2 className="text-lg font-bold">Manual income</h2>
            <label className="block text-sm font-medium">
              Title
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
              />
            </label>
            <label className="block text-sm font-medium">
              Description
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Amount
                <input
                  required
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                />
              </label>
              <label className="block text-sm font-medium">
                Date
                <input
                  required
                  type="date"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                />
              </label>
            </div>
            <Button type="submit">Save — Revenue Updated</Button>
          </form>
        ) : null}
        {saved ? (
          <p className="text-sm text-brand-navy dark:text-brand-lime">
            Manual income saved (demo).
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search student, course, instructor…"
              className="h-11 border-0 bg-background pl-11 shadow-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-full px-3.5 py-2 text-xs font-semibold",
                  period === p
                    ? "bg-brand-navy text-white dark:bg-brand-lime dark:text-brand-navy"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <select
            value={method}
            onChange={(e) =>
              setMethod(e.target.value as (typeof METHODS)[number])
            }
            className="h-10 rounded-full border border-border bg-background px-4 text-sm"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m === "All" ? "All methods" : m}
              </option>
            ))}
          </select>
        </div>

        <ScrollTable
          minWidthClassName="min-w-[64rem]"
          toolbar={
            <div className="flex justify-between gap-3 text-sm">
              <p className="font-semibold">Revenue ledger</p>
              <p className="text-xs text-muted-foreground">
                {rows.length} result{rows.length === 1 ? "" : "s"}
              </p>
            </div>
          }
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Course</th>
              <th className="px-5 py-3 font-medium">Instructor</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Method</th>
              <th className="px-5 py-3 font-medium">Gateway</th>
              <th className="px-5 py-3 font-medium">Date</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {rows.length === 0 ? (
              <ScrollTableEmpty colSpan={7} message="No revenue rows found." />
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border/70 hover:bg-accent/40"
                >
                  <td className="whitespace-nowrap px-5 py-4 font-semibold">
                    {r.student}
                  </td>
                  <td className="max-w-[14rem] px-5 py-4">
                    <span className="line-clamp-2">{r.course}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">
                    {r.instructor}
                  </td>
                  <td className="px-5 py-4">{money(r.amount)}</td>
                  <td className="px-5 py-4">{r.paymentMethod}</td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {r.paymentGateway}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                    {r.date}
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
