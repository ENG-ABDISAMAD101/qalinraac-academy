"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  downloadReportPdf,
  downloadReportXlsx,
  type ReportColumn,
} from "@/lib/academic-report-download";

export function FinanceDownloadMenu({
  title,
  subtitle,
  fileName,
  columns,
  rows,
}: {
  title: string;
  subtitle?: string;
  fileName: string;
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="icon" title="Download">
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            void downloadReportPdf({
              title,
              subtitle,
              columns,
              rows,
              fileName: `${fileName}.pdf`,
            })
          }
        >
          Download PDF
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            void downloadReportXlsx({
              sheetName: title.slice(0, 28),
              columns,
              rows,
              fileName: `${fileName}.xlsx`,
            })
          }
        >
          Download XLSX
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function formatFinanceDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const PERIOD_FILTERS = [
  { label: "All", value: "all" },
  { label: "Today", value: "today" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Annual", value: "annual" },
] as const;
