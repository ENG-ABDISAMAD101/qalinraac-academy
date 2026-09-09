"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
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
import {
  financeInstructorPaymentsRequest,
  getApiErrorMessage,
} from "@/lib/api";

type PaymentRow = {
  id: string;
  instructor: string;
  course: string;
  student: string;
  gross: number;
  instructorShare: number;
  platformShare: number;
  date: string;
};

function asRows(items: Record<string, unknown>[]): PaymentRow[] {
  return items.map((r) => ({
    id: String(r.id ?? ""),
    instructor: String(r.instructor ?? "Instructor"),
    course: String(r.course ?? "—"),
    student: String(r.student ?? "—"),
    gross: Number(r.gross ?? 0),
    instructorShare: Number(r.instructorShare ?? 0),
    platformShare: Number(r.platformShare ?? 0),
    date: String(r.date ?? ""),
  }));
}

export default function FinanceInstructorPaymentsPage() {
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [sharePercent, setSharePercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await financeInstructorPaymentsRequest(
        q.trim() || undefined,
      );
      setRows(asRows(res.items));
      setTotal(res.total ?? res.items.length);
      setSharePercent(res.sharePercent ?? null);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Could not load instructor payments."),
      );
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
        Instructor: r.instructor,
        Course: r.course,
        Student: r.student,
        Gross: r.gross,
        "Instructor share": r.instructorShare,
        "Platform share": r.platformShare,
        Date: formatFinanceDate(r.date),
      })),
    [rows],
  );

  return (
    <FinanceShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Instructor Payments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only earnings from course sales
            {sharePercent != null ? ` · ${sharePercent}% instructor share` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search instructor, course, student…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{total} results</p>
            <FinanceDownloadMenu
              title="Instructor Payments"
              fileName="finance-instructor-payments"
              columns={[
                { key: "Instructor", label: "Instructor" },
                { key: "Course", label: "Course" },
                { key: "Student", label: "Student" },
                { key: "Gross", label: "Gross" },
                { key: "Instructor share", label: "Instructor share" },
                { key: "Platform share", label: "Platform share" },
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
          <PageLoader label="Loading instructor payments" />
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
                <th className="px-5 py-3 font-medium">Instructor</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Gross</th>
                <th className="px-5 py-3 font-medium">Instructor share</th>
                <th className="px-5 py-3 font-medium">Platform share</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </ScrollTableHead>
            <tbody>
              {rows.length === 0 ? (
                <ScrollTableEmpty
                  colSpan={7}
                  message="No instructor payments found"
                />
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/70 hover:bg-accent/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                      {r.instructor}
                    </td>
                    <td className="max-w-[14rem] px-5 py-4">
                      <span className="line-clamp-1">{r.course}</span>
                    </td>
                    <td className="px-5 py-4">{r.student}</td>
                    <td className="px-5 py-4">{money(r.gross)}</td>
                    <td className="px-5 py-4 font-semibold">
                      {money(r.instructorShare)}
                    </td>
                    <td className="px-5 py-4">{money(r.platformShare)}</td>
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
    </FinanceShell>
  );
}
