"use client";

import { FormEvent, useState } from "react";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { Button } from "@/components/ui/button";
import { demoSystemSettings } from "@/lib/super-admin-demo-data";

export default function SuperAdminSettingsPage() {
  const [s, setS] = useState(demoSystemSettings);
  const [saved, setSaved] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaved(true);
  }

  return (
    <SuperAdminShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            System Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Institution, localization, registration, courses, certificates
          </p>
        </div>
        <form onSubmit={onSubmit} className="card-soft space-y-4 p-6">
          {(
            [
              ["institutionName", "Institution name"],
              ["contactEmail", "Contact email"],
              ["contactPhone", "Contact phone"],
              ["language", "Language"],
              ["currency", "Currency"],
              ["timezone", "Timezone"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm font-medium">
              {label}
              <input
                value={s[key]}
                onChange={(e) =>
                  setS((prev) => ({ ...prev, [key]: e.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
              />
            </label>
          ))}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={s.registrationOpen}
                onChange={(e) =>
                  setS((prev) => ({
                    ...prev,
                    registrationOpen: e.target.checked,
                  }))
                }
              />
              Registration open
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={s.certificateAutoApprove}
                onChange={(e) =>
                  setS((prev) => ({
                    ...prev,
                    certificateAutoApprove: e.target.checked,
                  }))
                }
              />
              Auto-approve certificates
            </label>
          </div>
          <label className="block text-sm font-medium">
            Default instructor course limit
            <input
              type="number"
              value={s.courseLimitDefault}
              onChange={(e) =>
                setS((prev) => ({
                  ...prev,
                  courseLimitDefault: Number(e.target.value),
                }))
              }
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
          <p className="text-xs text-muted-foreground">
            Public registration always creates role: {s.publicRole}. Logo /
            favicon upload hooks available in production.
          </p>
          <Button type="submit">Save settings</Button>
          {saved ? (
            <p className="text-sm text-brand-navy dark:text-brand-lime">
              Settings saved (demo) — audit log entry created.
            </p>
          ) : null}
        </form>
      </div>
    </SuperAdminShell>
  );
}
