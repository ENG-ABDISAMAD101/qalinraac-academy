"use client";

import { Download, FileSpreadsheet, FileText, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AcademicShell } from "@/components/academic/AcademicShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  downloadReportPdf,
  downloadReportXlsx,
} from "@/lib/academic-report-download";
import { academicStudentsRequest, getApiErrorMessage } from "@/lib/api";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  courses: number;
  progress: number;
  status: string;
};

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "courses", label: "Courses" },
  { key: "progress", label: "Progress %" },
  { key: "status", label: "Status" },
];

export default function AcademicStudentsPage() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (search?: string) => {
    setLoading(true);
    setError("");
    try {
      setRows(await academicStudentsRequest(search?.trim() || undefined));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load students."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(query);
  }, [load, query]);

  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  async function exportPdf() {
    setExporting(true);
    try {
      await downloadReportPdf({
        title: "Student Report",
        subtitle: `${rows.length} students · Academic operations`,
        columns: COLUMNS,
        rows: rows.map((s) => ({
          name: s.name,
          email: s.email,
          phone: s.phone,
          courses: s.courses,
          progress: s.progress,
          status: s.status,
        })),
        fileName: "qalinraac-students-report.pdf",
      });
    } finally {
      setExporting(false);
    }
  }

  function exportXlsx() {
    downloadReportXlsx({
      sheetName: "Students",
      columns: COLUMNS,
      rows: rows.map((s) => ({
        name: s.name,
        email: s.email,
        phone: s.phone,
        courses: s.courses,
        progress: s.progress,
        status: s.status,
      })),
      fileName: "qalinraac-students-report.xlsx",
    });
  }

  return (
    <AcademicShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              Students
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View progress only — activations use existing accounts
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={exporting || rows.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Download report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => void exportPdf()}>
                  <FileText className="h-4 w-4" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportXlsx}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel (XLSX)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <label className="relative w-full max-w-sm min-w-[14rem]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, or phone…"
                className="h-11 border-0 bg-background pl-11 shadow-sm"
              />
            </label>
          </div>
        </div>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="overflow-hidden card-soft">
          {loading ? (
            <div className="flex min-h-[12rem] items-center justify-center">
              <Spinner label="Loading students" />
            </div>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Courses</th>
                  <th className="px-5 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-muted-foreground"
                    >
                      No students found.
                    </td>
                  </tr>
                ) : (
                  rows.map((s) => (
                    <tr key={s.id} className="border-b border-border/70">
                      <td className="px-5 py-4 font-semibold">{s.name}</td>
                      <td className="px-5 py-4">{s.email}</td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {s.phone}
                      </td>
                      <td className="px-5 py-4">{s.courses}</td>
                      <td className="px-5 py-4">{s.progress}%</td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            s.status === "Active" ? "lime" : "muted"
                          }
                        >
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AcademicShell>
  );
}
