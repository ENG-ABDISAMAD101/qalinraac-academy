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
import { FormField, formSelectClassName } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
} from "@/components/ui/scroll-table";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  financeCreateManualIncomeRequest,
  financeRevenueRequest,
  getApiErrorMessage,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type RevenueRow = {
  id: string;
  student: string;
  course: string;
  instructor: string;
  amount: number;
  paymentMethod: string;
  date: string;
  source: string;
};

function asRows(items: Record<string, unknown>[]): RevenueRow[] {
  return items.map((r) => ({
    id: String(r.id ?? ""),
    student: String(r.student ?? "—"),
    course: String(r.course ?? "—"),
    instructor: String(r.instructor ?? "—"),
    amount: Number(r.amount ?? 0),
    paymentMethod: String(r.paymentMethod ?? "—"),
    date: String(r.date ?? ""),
    source: String(r.source ?? "—"),
  }));
}

const emptyForm = {
  title: "",
  description: "",
  amount: "",
  paymentMethod: "manual",
  incomeDate: "",
};

export default function FinanceRevenuePage() {
  const [period, setPeriod] = useState<string>("all");
  const [method, setMethod] = useState("all");
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [methods, setMethods] = useState<string[]>([]);
  const [rows, setRows] = useState<RevenueRow[]>([]);
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
      const res = await financeRevenueRequest({
        period,
        method: method === "all" ? undefined : method,
        q: q.trim() || undefined,
      });
      setRows(asRows(res.items));
      setMethods(res.methods ?? []);
      setTotal(res.total ?? res.items.length);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load revenue."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [period, method, q]);

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
        Student: r.student,
        Course: r.course,
        Instructor: r.instructor,
        Amount: r.amount,
        Method: r.paymentMethod,
        Source: r.source,
        Date: formatFinanceDate(r.date),
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
      await financeCreateManualIncomeRequest({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        amountCents: Math.round(dollars * 100),
        paymentMethod: form.paymentMethod.trim() || "manual",
        incomeDate: form.incomeDate || undefined,
      });
      setModalOpen(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not save manual income."));
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
              Revenue
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Course sales and manual income ledger
            </p>
          </div>
          <Button type="button" onClick={() => setModalOpen(true)}>
            Add manual income
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
              placeholder="Search student, course, instructor…"
              className="pl-9"
            />
          </div>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={cn(formSelectClassName, "w-auto min-w-[10rem]")}
          >
            <option value="all">All methods</option>
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{total} results</p>
            <FinanceDownloadMenu
              title="Revenue"
              subtitle={`Period: ${period}`}
              fileName="finance-revenue"
              columns={[
                { key: "Student", label: "Student" },
                { key: "Course", label: "Course" },
                { key: "Instructor", label: "Instructor" },
                { key: "Amount", label: "Amount" },
                { key: "Method", label: "Method" },
                { key: "Source", label: "Source" },
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
          <PageLoader label="Loading revenue" />
        ) : (
          <ScrollTable
            minWidthClassName="min-w-[64rem]"
            maxHeightClassName="max-h-[32rem]"
            toolbar={
              loading ? <Spinner className="sm" label="Updating" /> : null
            }
          >
            <ScrollTableHead>
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Course / Title</th>
                <th className="px-5 py-3 font-medium">Instructor</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </ScrollTableHead>
            <tbody>
              {rows.length === 0 ? (
                <ScrollTableEmpty colSpan={7} message="No revenue found" />
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/70 hover:bg-accent/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                      {r.student}
                    </td>
                    <td className="max-w-[16rem] px-5 py-4">
                      <span className="line-clamp-1">{r.course}</span>
                    </td>
                    <td className="px-5 py-4">{r.instructor}</td>
                    <td className="px-5 py-4 font-semibold">{money(r.amount)}</td>
                    <td className="px-5 py-4">{r.paymentMethod}</td>
                    <td className="px-5 py-4 text-muted-foreground">{r.source}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatFinanceDate(r.date)}
                    </td>
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
            <DialogTitle>Add manual income</DialogTitle>
            <DialogDescription>
              Record income that is not from a course sale.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(e) => void onSave(e)}>
            <FormField label="Title" htmlFor="manual-title">
              <Input
                id="manual-title"
                required
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Sponsorship, grant…"
              />
            </FormField>
            <FormField label="Amount (USD)" htmlFor="manual-amount">
              <Input
                id="manual-amount"
                required
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                placeholder="100.00"
              />
            </FormField>
            <FormField label="Payment method" htmlFor="manual-method">
              <select
                id="manual-method"
                className={formSelectClassName}
                value={form.paymentMethod}
                onChange={(e) =>
                  setForm((f) => ({ ...f, paymentMethod: e.target.value }))
                }
              >
                <option value="manual">Manual</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="waafi">Waafi</option>
                <option value="evc_plus">EVC Plus</option>
                <option value="zaad">Zaad</option>
                <option value="stripe">Stripe</option>
              </select>
            </FormField>
            <FormField label="Date" htmlFor="manual-date">
              <Input
                id="manual-date"
                type="date"
                value={form.incomeDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, incomeDate: e.target.value }))
                }
              />
            </FormField>
            <FormField label="Description" htmlFor="manual-desc">
              <Textarea
                id="manual-desc"
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
