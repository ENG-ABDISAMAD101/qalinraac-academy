"use client";

import { FormEvent, useState } from "react";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { Button } from "@/components/ui/button";
import { demoIntegrations } from "@/lib/super-admin-demo-data";

export default function SuperAdminIntegrationsPage() {
  const [pay, setPay] = useState(demoIntegrations.payments);
  const [email, setEmail] = useState(demoIntegrations.email);
  const [flash, setFlash] = useState<string | null>(null);

  function save(e: FormEvent) {
    e.preventDefault();
    setFlash(
      "Integrations saved (demo). Finance can use payment settings but cannot edit them.",
    );
  }

  return (
    <SuperAdminShell>
      <form
        onSubmit={save}
        className="mx-auto max-w-3xl space-y-8 px-4 py-6 sm:px-6 lg:px-8"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
            Integrations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Payments (Waafi, Stripe) and email (SES / SMTP)
          </p>
        </div>

        <section className="card-soft space-y-4 p-6">
          <h2 className="text-lg font-bold">Payment settings</h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pay.waafi.enabled}
              onChange={(e) =>
                setPay((p) => ({
                  ...p,
                  waafi: { ...p.waafi, enabled: e.target.checked },
                }))
              }
            />
            Waafi enabled · {pay.waafi.merchantId}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pay.stripe.enabled}
              onChange={(e) =>
                setPay((p) => ({
                  ...p,
                  stripe: { ...p.stripe, enabled: e.target.checked },
                }))
              }
            />
            Stripe enabled · {pay.stripe.publishableKey}
          </label>
          <label className="block text-sm font-medium">
            Instructor revenue share (%)
            <input
              type="number"
              value={pay.instructorSharePct}
              onChange={(e) =>
                setPay((p) => ({
                  ...p,
                  instructorSharePct: Number(e.target.value),
                }))
              }
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Currency
            <input
              value={pay.currency}
              onChange={(e) =>
                setPay((p) => ({ ...p, currency: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
        </section>

        <section className="card-soft space-y-4 p-6">
          <h2 className="text-lg font-bold">Email settings</h2>
          <label className="block text-sm font-medium">
            Provider
            <input
              value={email.provider}
              onChange={(e) =>
                setEmail((prev) => ({ ...prev, provider: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium">
            Sender email
            <input
              value={email.sender}
              onChange={(e) =>
                setEmail((prev) => ({ ...prev, sender: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium">
            SMTP host
            <input
              value={email.smtpHost}
              onChange={(e) =>
                setEmail((prev) => ({ ...prev, smtpHost: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={email.otpEnabled}
              onChange={(e) =>
                setEmail((prev) => ({
                  ...prev,
                  otpEnabled: e.target.checked,
                }))
              }
            />
            OTP emails enabled
          </label>
          <p className="text-xs text-muted-foreground">
            Templates: password reset, notifications, OTP (edit in production
            CMS).
          </p>
        </section>

        <Button type="submit">Save integrations</Button>
        {flash ? (
          <p className="text-sm text-brand-navy dark:text-brand-lime">{flash}</p>
        ) : null}
      </form>
    </SuperAdminShell>
  );
}
