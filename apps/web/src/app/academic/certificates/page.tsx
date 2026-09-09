"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AcademicShell,
  academicStatusTone,
} from "@/components/academic/AcademicShell";
import { Button } from "@/components/ui/button";
import {
  ScrollTable,
  ScrollTableEmpty,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import { Spinner } from "@/components/ui/spinner";
import {
  academicCertificatesRequest,
  getApiErrorMessage,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type CertRow = {
  id: string;
  student: string;
  course: string;
  instructor: string;
  completionDate?: string;
  progress: number;
  certificateNumber: string;
  status: string;
};

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

export default function AcademicCertificatesPage() {
  const [rows, setRows] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows((await academicCertificatesRequest()) as CertRow[]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not load certificates."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AcademicShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Certificates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Course completed → request → academic review
          </p>
        </div>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex min-h-[12rem] items-center justify-center">
            <Spinner label="Loading certificates" />
          </div>
        ) : (
          <ScrollTable minWidthClassName="min-w-[64rem]">
            <ScrollTableHead>
              <tr>
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Instructor</th>
                <th className="px-5 py-3 font-medium">Completion</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <th className="px-5 py-3 font-medium">Certificate #</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <StickyActionHead />
              </tr>
            </ScrollTableHead>
            <tbody>
              {rows.length === 0 ? (
                <ScrollTableEmpty
                  colSpan={8}
                  message="No certificate requests yet."
                />
              ) : (
                rows.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/70 hover:bg-accent/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold">
                      {c.student}
                    </td>
                    <td className="max-w-[14rem] px-5 py-4">
                      <span className="line-clamp-2">{c.course}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      {c.instructor}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                      {formatDate(c.completionDate)}
                    </td>
                    <td className="px-5 py-4">{c.progress}%</td>
                    <td className="whitespace-nowrap px-5 py-4 text-xs">
                      {c.certificateNumber}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold",
                          academicStatusTone(c.status),
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                    <StickyActionCell>
                      <Button asChild size="sm">
                        <Link href={`/academic/certificates/${c.id}`}>
                          {c.status === "Pending Review" ? "Review" : "View"}
                        </Link>
                      </Button>
                    </StickyActionCell>
                  </tr>
                ))
              )}
            </tbody>
          </ScrollTable>
        )}
      </div>
    </AcademicShell>
  );
}
