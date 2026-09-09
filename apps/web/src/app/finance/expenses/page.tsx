"use client";

import { FormEvent, useMemo, useState } from "react";
import { FinanceShell, money } from "@/components/finance/FinanceShell";
import { Button } from "@/components/ui/button";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { demoFinanceExpenses } from "@/lib/finance-demo-data";
import { cn } from "@/lib/utils";

const PERIODS = ["All", "Today", "Weekly", "Monthly", "Annual"] as const;

export default function FinanceExpensesPage() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("All");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [saved, setSaved] = useState(false);

  const rows = useMemo(() => [...demoFinanceExpenses], []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(true);
    setShowForm(false);
  }

  return (
    <FinanceShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              Expenses
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create expense → save → expense recorded
            </p>
          </div>
          <Button type="button" onClick={() => setShowForm((v) => !v)}>
            Add Expense
          </Button>
        </div>

        {showForm ? (
          <form onSubmit={onSubmit} className="card-soft max-w-xl space-y-4 p-6">
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
                Expense date
                <input
                  required
                  type="date"
                  className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
                />
              </label>
            </div>
            <Button type="submit">Save Expense</Button>
          </form>
        ) : null}
        {saved ? (
          <p className="text-sm text-brand-navy dark:text-brand-lime">
            Expense recorded (demo).
          </p>
        ) : null}

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

        <ScrollTable
          minWidthClassName="min-w-[48rem]"
          toolbar={
            <div className="flex justify-between gap-3 text-sm">
              <p className="font-semibold">Expense ledger</p>
              <p className="text-xs text-muted-foreground">
                {rows.length} result{rows.length === 1 ? "" : "s"}
              </p>
            </div>
          }
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Created By</th>
            </tr>
          </ScrollTableHead>
          <tbody>
            {rows.length === 0 ? (
              <ScrollTableEmpty colSpan={5} />
            ) : (
              rows.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border/70 hover:bg-accent/40"
                >
                  <td className="whitespace-nowrap px-5 py-4 font-semibold">
                    {e.title}
                  </td>
                  <td className="max-w-[18rem] px-5 py-4 text-muted-foreground">
                    <span className="line-clamp-2">{e.description}</span>
                  </td>
                  <td className="px-5 py-4">{money(e.amount)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                    {e.date}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4">{e.createdBy}</td>
                </tr>
              ))
            )}
          </tbody>
        </ScrollTable>
      </div>
    </FinanceShell>
  );
}
