"use client";

import { BookOpen, Download, FileText, Search, User } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  InstructorShell,
  statusTone,
} from "@/components/instructor/InstructorShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  getApiErrorMessage,
  instructorStudentsRequest,
  mediaPublicUrl,
} from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

type StudentRow = Awaited<
  ReturnType<typeof instructorStudentsRequest>
>["items"][number];

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

function downloadCsv(rows: StudentRow[]) {
  const header = [
    "Name",
    "Email",
    "Course",
    "Status",
    "Progress",
    "Enrolled",
  ];
  const lines = rows.map((s) =>
    [
      s.name,
      s.email,
      s.courseTitle,
      s.status,
      `${s.progress}%`,
      formatDate(s.enrolledAt),
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
  a.download = "students-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPrintablePdf(rows: StudentRow[]) {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  const tableRows = rows
    .map(
      (s) =>
        `<tr>
          <td>${s.name}</td>
          <td>${s.email}</td>
          <td>${s.courseTitle}</td>
          <td>${s.status}</td>
          <td>${s.progress}%</td>
          <td>${formatDate(s.enrolledAt)}</td>
        </tr>`,
    )
    .join("");
  win.document.write(`<!DOCTYPE html><html><head><title>Students Report</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:24px;color:#111827}
      h1{color:#111827;font-size:20px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #e5e7eb;padding:8px;text-align:left}
      th{background:#F7F8FA}
    </style></head><body>
    <h1>Students Report</h1>
    <table>
      <thead><tr>
        <th>Name</th><th>Email</th><th>Course</th><th>Status</th><th>Progress</th><th>Enrolled</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
    <script>window.onload=function(){window.print()}<\/script>
    </body></html>`);
  win.document.close();
}

export default function InstructorStudentsPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError("");
    try {
      const data = await instructorStudentsRequest(query);
      setItems(data.items);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load students."));
      setItems([]);
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

  return (
    <InstructorShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
              Students
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Students enrolled in your courses only
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={items.length === 0}
              onClick={() => downloadCsv(items)}
            >
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={items.length === 0}
              onClick={() => downloadPrintablePdf(items)}
            >
              <FileText className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <label className="relative block max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search students or courses"
            className="pl-11"
          />
        </label>

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading students" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : items.length === 0 ? (
          <div className="card-soft px-5 py-12 text-center text-sm text-muted-foreground">
            No students found.
          </div>
        ) : (
          <div className="overflow-hidden card-soft">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Enrolled</th>
                  <th className="px-5 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s.id} className="border-b border-border/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-primary">
                          <User className="h-4 w-4" aria-hidden />
                        </span>
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarImage
                            src={mediaPublicUrl(s.avatarUrl)}
                            alt=""
                          />
                          <AvatarFallback>
                            {initialsFromName(s.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                        <span>{s.courseTitle}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(s.enrolledAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${s.progress}%` }}
                          />
                        </div>
                        <span className="text-xs">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold capitalize",
                          statusTone(
                            s.status === "active"
                              ? "Published"
                              : s.status === "completed"
                                ? "Completed"
                                : "Pending",
                          ),
                        )}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </InstructorShell>
  );
}
