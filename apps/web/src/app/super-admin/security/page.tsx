"use client";

import { FormEvent, useState } from "react";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { Button } from "@/components/ui/button";
import { demoSecurityConfig } from "@/lib/super-admin-demo-data";

export default function SuperAdminSecurityPage() {
  const [cfg, setCfg] = useState(demoSecurityConfig);
  const [saved, setSaved] = useState(false);

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
            Security
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            JWT, sessions, password policy, rate limits, 2FA, upload security
          </p>
        </div>
        <section className="card-soft grid gap-4 p-6 sm:grid-cols-2">
          {(
            [
              ["jwtAccessMinutes", "JWT access (minutes)"],
              ["jwtRefreshDays", "JWT refresh (days)"],
              ["sessionIdleMinutes", "Session idle (minutes)"],
              ["minPasswordLength", "Min password length"],
              ["rateLimitPerMin", "Rate limit / minute"],
              ["maxUploadMb", "Max upload (MB)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm font-medium">
              {label}
              <input
                type="number"
                value={cfg[key]}
                onChange={(e) =>
                  setCfg((prev) => ({
                    ...prev,
                    [key]: Number(e.target.value),
                  }))
                }
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
              />
            </label>
          ))}
          <label className="block text-sm font-medium sm:col-span-2">
            Allowed IP CIDRs
            <input
              value={cfg.allowedIpCidrs}
              onChange={(e) =>
                setCfg((prev) => ({
                  ...prev,
                  allowedIpCidrs: e.target.value,
                }))
              }
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
            <input
              type="checkbox"
              checked={cfg.require2fa}
              onChange={(e) =>
                setCfg((prev) => ({ ...prev, require2fa: e.target.checked }))
              }
            />
            Require 2FA for staff roles
          </label>
          <div className="sm:col-span-2">
            <Button type="submit">Save security policy</Button>
            {saved ? (
              <p className="mt-3 text-sm text-brand-navy dark:text-brand-lime">
                Security policy updated (demo) — audited.
              </p>
            ) : null}
          </div>
        </section>
      </form>
    </SuperAdminShell>
  );
}
