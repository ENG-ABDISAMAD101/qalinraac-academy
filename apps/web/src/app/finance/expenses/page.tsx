"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FinanceShell, money } from "@/components/finance/FinanceShell";
import {
  FinanceDownloadMenu,
  formatFinanceDate,
  PERIOD_FILTERS,
} from "@/components/finance/FinanceDownloadMenu";
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
import { Input } from "@/components/ui/input";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  financeCreateExpenseRequest,
  financeExpensesRequest,
  getApiErrorMessage,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type ExpenseRow = {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdBy: string;
};

function asRows(items: Record<string, unknown>[]): ExpenseRow[] {
  return items.map((r) => ({
    id: String(r.id ?? ""),
    title: String(r.title ?? "—"),
    description: String(r.description ?? ""),
    amount: Number(r.amount ?? 0),
    category: String(r.category ?? "—"),
    date: String(r.date ?? ""),
    createdBy: String(r.createdBy ?? "—"),
  }));
}

const emptyForm = {
  title: "",
  description: "",
  amount: "",
  category: "",
  expenseDate: "",
};

export default function FinanceExpensesPage() {
  const [period, setPeriod] = useState<string>("all");
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await financeExpensesRequest({
        period,
        q: q.trim() || undefined,
      });
      setRows(asRows(res.items));
      setTotal(res.total ?? res.items.length);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load expenses."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [period, q]);

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
        Title: r.title,
        Description: r.description,
        Amount: r.amount,
        Category: r.category,
        Date: formatFinanceDate(r.date),
        "Created by": r.createdBy,
      })),
    [rows],
  );

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const dollars = Number(form.amount);
    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setFormError("Enter a valid amount.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await financeCreateExpenseRequest({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        amountCents: Math.round(dollars * 100),
        category: form.category.trim() || undefined,
        expenseDate: form.expenseDate || undefined,
      });
      setModalOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not save expense."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <FinanceShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Expenses
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Operating costs and recorded outflows
            </p>
          </div>
          <Button type="button" onClick={() => setModalOpen(true)}>
            Add expense
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PERIOD_FILTERS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                period === p.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search title, category, creator…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{total} results</p>
            <FinanceDownloadMenu
              title="Expenses"
              subtitle={`Period: ${period}`}
              fileName="finance-expenses"
              columns={[
                { key: "Title", label: "Title" },
                { key: "Description", label: "Description" },
                { key: "Amount", label: "Amount" },
                { key: "Category", label: "Category" },
                { key: "Date", label: "Date" },
                { key: "Created by", label: "Created by" },
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
          <PageLoader label="Loading expenses" />
        ) : (
          <ScrollTable
            minWidthClassName="min-w-[60rem]"
            maxHeightClassName="max-h-[32rem]"
            toolbar={
              loading ? <Spinner className="sm" label="Updating" /> : null
            }
          >
            <ScrollTableHead>
              <tr>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Created by</th>
              </tr>
            </ScrollTableHead>
            <tbody>
              {rows.length === 0 ? (
                <ScrollTableEmpty colSpan={6} message="No expenses found" />
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/70 hover:bg-accent/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                      {r.title}
                    </td>
                    <td className="max-w-[18rem] px-5 py-4 text-muted-foreground">
                      <span className="line-clamp-2">
                        {r.description || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold">{money(r.amount)}</td>
                    <td className="px-5 py-4">{r.category}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatFinanceDate(r.date)}
                    </td>
                    <td className="px-5 py-4">{r.createdBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </ScrollTable>
        )}
      </div>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setForm(emptyForm);
            setFormError("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
            <DialogDescription>
              Log an operating expense against the academy books.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => void onSave(e)}>
            <FormField label="Title" htmlFor="exp-title">
              <Input
                id="exp-title"
                required
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Hosting, marketing…"
              />
            </FormField>
            <FormField label="Amount (USD)" htmlFor="exp-amount">
              <Input
                id="exp-amount"
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="50.00"
              />
            </FormField>
            <FormField label="Category" htmlFor="exp-category">
              <Input
                id="exp-category"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
                placeholder="Operations, Marketing…"
              />
            </FormField>
            <FormField label="Date" htmlFor="exp-date">
              <Input
                id="exp-date"
                type="date"
                value={form.expenseDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expenseDate: e.target.value }))
                }
              />
            </FormField>
            <FormField label="Description" htmlFor="exp-desc">
              <Textarea
                id="exp-desc"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Optional notes"
              />
            </FormField>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            <DialogFormActions
              showHelp={false}
              confirmLabel="Save"
              confirmLoading={saving}
              onCancel={() => setModalOpen(false)}
            />
          </form>
        </DialogContent>
      </Dialog>
    </FinanceShell>
  );
}
