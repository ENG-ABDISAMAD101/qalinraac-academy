"use client";

import { Download, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { InstructorShell } from "@/components/instructor/InstructorShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  formatMoney,
  getApiErrorMessage,
  instructorEarningsRequest,
} from "@/lib/api";

type EarningsData = Awaited<ReturnType<typeof instructorEarningsRequest>>;

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function downloadCsv(data: EarningsData) {
  const header = [
    "Course",
    "Student",
    "Email",
    "Sale",
    "Instructor share",
    "Currency",
    "Date",
  ];
  const lines = data.items.map((e) =>
    [
      e.courseTitle,
      e.studentName,
      e.studentEmail,
      (e.amountCents / 100).toFixed(2),
      (e.instructorShareCents / 100).toFixed(2),
      e.currency,
      formatDate(e.paidAt),
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(","),
  );
  const blob = new Blob([[header.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "earnings-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function InstructorEarningsPage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError("");
    try {
      setData(await instructorEarningsRequest(query));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load earnings."));
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

  const cards = [
    {
      label: "Total earnings",
      value: formatMoney(data?.totalEarnings ?? 0),
    },
    {
      label: "Balance",
      value: formatMoney(data?.availableBalance ?? 0),
    },
    {
      label: "Pending withdrawal",
      value: formatMoney(data?.pendingWithdrawal ?? 0),
    },
    {
      label: "Instructor share",
      value: `${sharePercent}%`,
    },
  ];

  return (
    <InstructorShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Earnings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track course sales and your available balance.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!data?.items.length}
            onClick={() => data && downloadCsv(data)}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search student or course"
            className="pl-11"
          />
        </label>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading earnings" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {cards.map((c) => (
                <div key={c.label} className="card-soft px-5 py-4">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
                    {c.value}
                  </p>
                </div>
              ))}
            </div>

            {(data?.items.length ?? 0) === 0 ? (
              <div className="card-soft px-5 py-12 text-center text-sm text-muted-foreground">
                No earnings yet.
              </div>
            ) : (
              <div className="overflow-hidden card-soft">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Course</th>
                      <th className="px-5 py-3 font-medium">Student</th>
                      <th className="px-5 py-3 font-medium">Sale</th>
                      <th className="px-5 py-3 font-medium">Your share</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data!.items.map((e) => (
                      <tr key={e.id} className="border-b border-border/70">
                        <td className="px-5 py-4 font-semibold">
                          {e.courseTitle}
                        </td>
                        <td className="px-5 py-4">
                          <p>{e.studentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.studentEmail}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {formatMoney(e.amountCents, e.currency)}
                        </td>
                        <td className="px-5 py-4 font-semibold">
                          {formatMoney(e.instructorShareCents, e.currency)}
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">
                          {formatDate(e.paidAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </InstructorShell>
  );
}
