"use client";

import { useState } from "react";
import {
  SuperAdminShell,
  saStatusTone,
} from "@/components/super-admin/SuperAdminShell";
import { Button } from "@/components/ui/button";
import {
  ScrollTable,
  ScrollTableHead,
  StickyActionCell,
  StickyActionHead,
} from "@/components/ui/scroll-table";
import { demoSaCertificates } from "@/lib/super-admin-demo-data";
import { cn } from "@/lib/utils";

export default function SuperAdminCertificatesPage() {
  const [items, setItems] = useState(demoSaCertificates);
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <SuperAdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Certificates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and override certificate requests globally
          </p>
        </div>
        {flash ? (
          <p className="text-sm text-primary">{flash}</p>
        ) : null}
        <ScrollTable minWidthClassName="min-w-[48rem]">
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Course</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Requested</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-border/70">
                <td className="px-5 py-4 font-semibold">{c.student}</td>
                <td className="px-5 py-4">{c.course}</td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      saStatusTone(c.status),
                    )}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {c.requestedAt}
                </td>
                <StickyActionCell>
                  {c.status === "Pending" ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          setItems((prev) =>
                            prev.map((x) =>
                              x.id === c.id ? { ...x, status: "Approved" } : x,
                            ),
                          );
                          setFlash(`Approved certificate · ${c.student}`);
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setItems((prev) =>
                            prev.map((x) =>
                              x.id === c.id ? { ...x, status: "Rejected" } : x,
                            ),
                          );
                          setFlash(`Rejected certificate · ${c.student}`);
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </StickyActionCell>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </SuperAdminShell>
  );
}
