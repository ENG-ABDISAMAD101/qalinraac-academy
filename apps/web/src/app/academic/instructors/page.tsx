"use client";

import Link from "next/link";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AcademicShell } from "@/components/academic/AcademicShell";
import { Badge, courseStatusBadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import { Spinner } from "@/components/ui/spinner";
import {
  downloadReportPdf,
  downloadReportXlsx,
} from "@/lib/academic-report-download";
import { academicInstructorsRequest, getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

type Tab = "all" | "active" | "activity";

type InstructorRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  courses: number;
  students: number;
  performance: number;
};

type ActivityRow = {
  id: string;
  instructor: string;
  instructorId: string;
  course: string;
  courseStatus: string;
  students: number;
  progress: number;
  lastActivity: string;
};

const COURSE_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending Review",
  published: "Published",
};

function courseStatusLabel(status: string) {
  return (
    COURSE_STATUS_LABEL[status] ??
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "status", label: "Status" },
  { key: "courses", label: "Courses" },
  { key: "students", label: "Students" },
  { key: "performance", label: "Performance %" },
];

export default function AcademicInstructorsPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [instructors, setInstructors] = useState<InstructorRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (filter: Tab) => {
    setLoading(true);
    setError("");
    try {
      const data = await academicInstructorsRequest({ filter });
      setInstructors(data.instructors ?? []);
      setActivity(data.activity ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load instructors."));
      setInstructors([]);
      setActivity([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [load, tab]);

  async function exportPdf() {
    setExporting(true);
    try {
      await downloadReportPdf({
        title: "Instructors Report",
        subtitle: `${instructors.length} instructors · Academic operations`,
        columns: COLUMNS,
        rows: instructors.map((i) => ({
          name: i.name,
          email: i.email,
          phone: i.phone,
          status: i.status,
          courses: i.courses,
          students: i.students,
          performance: i.performance,
        })),
        fileName: "qalinraac-instructors-report.pdf",
      });
    } finally {
      setExporting(false);
    }
  }

  function exportXlsx() {
    downloadReportXlsx({
      sheetName: "Instructors",
      columns: COLUMNS,
      rows: instructors.map((i) => ({
        name: i.name,
        email: i.email,
        phone: i.phone,
        status: i.status,
        courses: i.courses,
        students: i.students,
        performance: i.performance,
      })),
      fileName: "qalinraac-instructors-report.xlsx",
    });
  }

  return (
    <AcademicShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              Instructors
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Institutional appointment only — no public applications
            </p>
          </div>
          {tab !== "activity" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={exporting || instructors.length === 0}
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
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All Instructors"],
              ["active", "Active"],
              ["activity", "Course Activity"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                tab === key
                  ? "bg-brand-navy text-white dark:bg-brand-lime dark:text-brand-navy"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading instructors" />
          </div>
        ) : tab !== "activity" ? (
          <ScrollTable minWidthClassName="min-w-[56rem]">
            <ScrollTableHead>
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Courses</th>
                <th className="px-5 py-3 font-medium">Students</th>
                <th className="px-5 py-3 font-medium">Performance</th>
                <StickyActionHead />
              </tr>
            </ScrollTableHead>
            <tbody>
              {instructors.length === 0 ? (
                <ScrollTableEmpty colSpan={8} message="No instructors found." />
              ) : (
                instructors.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-border/70 hover:bg-accent/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                      {i.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">{i.email}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                      {i.phone}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={i.status === "Active" ? "lime" : "muted"}
                      >
                        {i.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">{i.courses}</td>
                    <td className="px-5 py-4">{i.students}</td>
                    <td className="px-5 py-4">{i.performance}%</td>
                    <StickyActionCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/academic/instructors/${i.id}`}>View</Link>
                      </Button>
                    </StickyActionCell>
                  </tr>
                ))
              )}
            </tbody>
          </ScrollTable>
        ) : (
          <ScrollTable minWidthClassName="min-w-[52rem]">
            <ScrollTableHead>
              <tr>
                <th className="px-5 py-3 font-medium">Instructor</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Students</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <th className="px-5 py-3 font-medium">Last activity</th>
              </tr>
            </ScrollTableHead>
            <tbody>
              {activity.length === 0 ? (
                <ScrollTableEmpty
                  colSpan={6}
                  message="No course activity yet."
                />
              ) : (
                activity
                  .filter(
                    (a) =>
                      a.courseStatus !== "rejected" &&
                      a.courseStatus !== "archived",
                  )
                  .map((a) => {
                    const label = courseStatusLabel(a.courseStatus);
                    return (
                      <tr
                        key={a.id}
                        className="border-b border-border/70 hover:bg-accent/40"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          {a.instructor}
                        </td>
                        <td className="px-5 py-4">{a.course}</td>
                        <td className="px-5 py-4">
                          <Badge
                            variant={courseStatusBadgeVariant(a.courseStatus)}
                          >
                            {label}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">{a.students}</td>
                        <td className="px-5 py-4">{a.progress}%</td>
                        <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                          {formatDate(a.lastActivity)}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </ScrollTable>
        )}
      </div>
    </AcademicShell>
  );
}
