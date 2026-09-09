"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  SuperAdminShell,
  saStatusTone,
} from "@/components/super-admin/SuperAdminShell";
import { Button } from "@/components/ui/button";
import { demoPlatformUsers } from "@/lib/super-admin-demo-data";
import { cn } from "@/lib/utils";

export default function SuperAdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const base =
    demoPlatformUsers.find((u) => u.id === params.id) ?? demoPlatformUsers[0];
  const [status, setStatus] = useState(base.status);
  const [flash, setFlash] = useState<string | null>(null);

  return (
    <SuperAdminShell>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/super-admin/users">← Users</Link>
        </Button>
        <div className="card-soft space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-brand-navy dark:text-foreground">
                {base.name}
              </h1>
              <p className="text-sm text-muted-foreground">{base.email}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                saStatusTone(status),
              )}
            >
              {status}
            </span>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-semibold">{base.role}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Registered</dt>
              <dd className="font-semibold">{base.registeredAt}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last active</dt>
              <dd className="font-semibold">{base.lastActive}</dd>
            </div>
          </dl>
          <div>
            <h2 className="mb-2 text-sm font-bold">Recent activity</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Signed in · 08 Sep 2026</li>
              <li>Updated profile · 01 Sep 2026</li>
              <li>Account created · {base.registeredAt}</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setStatus((s) => (s === "Active" ? "Disabled" : "Active"))
              }
            >
              {status === "Active" ? "Disable" : "Enable"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFlash("Reset email queued (demo).")}
            >
              Reset account
            </Button>
          </div>
          {flash ? (
            <p className="text-sm text-brand-navy dark:text-brand-lime">{flash}</p>
          ) : null}
        </div>
      </div>
    </SuperAdminShell>
  );
}
