"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StudentShell } from "@/components/student/StudentShell";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  formatMoney,
  getApiErrorMessage,
  studentOrdersRequest,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type OrderRow = {
  id: string;
  courseTitle: string;
  amountCents: number;
  currency: string;
  status: string;
  method?: string;
  date: string;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value || "—";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatStatus(status: string) {
  return status
    .split(/[_\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function OrdersPage() {
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await studentOrdersRequest();
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load orders."));
          setOrders([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return orders;
    return orders.filter(
      (o) =>
        o.courseTitle.toLowerCase().includes(needle) ||
        (o.method?.toLowerCase().includes(needle) ?? false) ||
        o.status.toLowerCase().includes(needle),
    );
  }, [orders, q]);

  return (
    <StudentShell>
      <div className="space-y-6 px-6 py-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              Orders
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Purchase history and payment status
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search orders"
              className="pl-11"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[14rem] items-center justify-center">
            <Spinner label="Loading orders" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : filtered.length === 0 ? (
          <div className="card-soft px-6 py-14 text-center">
            <h2 className="font-display text-xl font-bold text-brand-navy dark:text-foreground">
              No orders found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Course purchases will appear here with amount, payment method, and
              status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto card-soft">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border bg-canvas/70 text-xs uppercase tracking-wide text-muted-foreground dark:bg-muted/40">
                <tr>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Method</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-border/70 last:border-0">
                    <td className="px-5 py-4 font-semibold text-ink dark:text-foreground">
                      {o.courseTitle}
                    </td>
                    <td className="px-5 py-4">
                      {formatMoney(o.amountCents, o.currency || "USD")}
                    </td>
                    <td className="px-5 py-4 capitalize text-muted-foreground">
                      {o.method || "—"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(o.date)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold",
                          o.status.toLowerCase() === "paid" ||
                            o.status.toLowerCase() === "succeeded"
                            ? "bg-brand-lime-soft text-brand-navy"
                            : "bg-canvas text-brand-navy dark:bg-muted dark:text-foreground",
                        )}
                      >
                        {formatStatus(o.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
