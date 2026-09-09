"use client";

import { FormEvent, useState } from "react";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { Button } from "@/components/ui/button";
import { demoStorageConfig } from "@/lib/super-admin-demo-data";

export default function SuperAdminStoragePage() {
  const [cfg, setCfg] = useState(demoStorageConfig);
  const [saved, setSaved] = useState(false);
  const usedPct = Math.round((cfg.usedGb / cfg.quotaGb) * 100);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(true);
  }

  return (
    <SuperAdminShell>
      <form
        onSubmit={onSubmit}
        className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Storage & Videos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cloudflare R2, CDN, upload limits, and video configuration
          </p>
        </div>

        <section className="card-soft space-y-4 p-6">
          <div>
            <p className="text-xs text-muted-foreground">Storage usage</p>
            <p className="mt-1 text-2xl font-bold">
              {cfg.usedGb} / {cfg.quotaGb} GB ({usedPct}%)
            </p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand-lime"
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>
          {(
            [
              ["provider", "Provider"],
              ["bucket", "Bucket"],
              ["region", "Region"],
              ["cdnDomain", "CDN domain"],
              ["videoProvider", "Video provider"],
              ["allowedTypes", "Allowed file types"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm font-medium">
              {label}
              <input
                value={cfg[key]}
                onChange={(e) =>
                  setCfg((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
              />
            </label>
          ))}
          <label className="block text-sm font-medium">
            Upload limit (MB)
            <input
              type="number"
              value={cfg.uploadLimitMb}
              onChange={(e) =>
                setCfg((prev) => ({
                  ...prev,
                  uploadLimitMb: Number(e.target.value),
                }))
              }
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
          <Button type="submit">Save storage config</Button>
          {saved ? (
            <p className="text-sm text-brand-navy dark:text-brand-lime">
              Storage configuration saved (demo).
            </p>
          ) : null}
        </section>
      </form>
    </SuperAdminShell>
  );
}
