"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
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
import {
  demoPlatformUsers,
  type PlatformRole,
} from "@/lib/super-admin-demo-data";
import { cn } from "@/lib/utils";

const ROLES: PlatformRole[] = [
  "Student",
  "Instructor",
  "Academic",
  "Finance",
  "Research",
  "Admin",
  "Super Admin",
];

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState(demoPlatformUsers);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | PlatformRole>("All");
  const [showCreate, setShowCreate] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Student" as PlatformRole,
  });

  const rows = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "All" && u.role !== roleFilter) return false;
      const hay = `${u.name} ${u.email} ${u.role}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [users, q, roleFilter]);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const id = `u${Date.now()}`;
    setUsers((prev) => [
      {
        id,
        name: form.name,
        email: form.email,
        role: form.role,
        status: "Active",
        registeredAt: "08 Sep 2026",
        lastActive: "—",
      },
      ...prev,
    ]);
    setForm({ name: "", email: "", role: "Student" });
    setShowCreate(false);
    setFlash(`Created ${form.email} as ${form.role} (demo).`);
  }

  return (
    <SuperAdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              Users
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create, edit, enable/disable, assign roles, reset — public signup
              is always Student
            </p>
          </div>
          <Button type="button" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? "Cancel" : "Create user"}
          </Button>
        </div>

        {showCreate ? (
          <form onSubmit={onCreate} className="card-soft grid gap-3 p-5 sm:grid-cols-4">
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
              className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
            />
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  role: e.target.value as PlatformRole,
                }))
              }
              className="rounded-2xl border border-border bg-background px-4 py-2.5 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <Button type="submit">Save user</Button>
          </form>
        ) : null}

        {flash ? (
          <p className="text-sm font-medium text-brand-navy dark:text-brand-lime">
            {flash}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email…"
            className="h-10 min-w-[14rem] flex-1 rounded-2xl border border-border bg-background px-4 text-sm"
          />
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as "All" | PlatformRole)
            }
            className="h-10 rounded-2xl border border-border bg-background px-3 text-sm"
          >
            <option value="All">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <ScrollTable
          minWidthClassName="min-w-[64rem]"
          maxHeightClassName="max-h-[34rem]"
        >
          <ScrollTableHead>
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Registered</th>
              <th className="px-5 py-3 font-medium">Last active</th>
              <StickyActionHead />
            </tr>
          </ScrollTableHead>
          <tbody>
            {rows.map((u) => (
              <tr
                key={u.id}
                className="border-b border-border/70 hover:bg-accent/40"
              >
                <td className="px-5 py-4 font-semibold">{u.name}</td>
                <td className="px-5 py-4">{u.email}</td>
                <td className="px-5 py-4">
                  <select
                    value={u.role}
                    onChange={(e) => {
                      const role = e.target.value as PlatformRole;
                      setUsers((prev) =>
                        prev.map((x) =>
                          x.id === u.id ? { ...x, role } : x,
                        ),
                      );
                      setFlash(
                        `Role updated · ${u.name} → ${role} (audited in demo).`,
                      );
                    }}
                    className="rounded-xl border border-border bg-background px-2 py-1 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-bold",
                      saStatusTone(u.status),
                    )}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {u.registeredAt}
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {u.lastActive}
                </td>
                <StickyActionCell>
                  <div className="flex flex-wrap gap-1">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/super-admin/users/${u.id}`}>View</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setUsers((prev) =>
                          prev.map((x) =>
                            x.id === u.id
                              ? {
                                  ...x,
                                  status:
                                    x.status === "Active"
                                      ? "Disabled"
                                      : "Active",
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      {u.status === "Active" ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setFlash(`Password reset email queued for ${u.email}.`)
                      }
                    >
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (u.role === "Super Admin") {
                          setFlash("Cannot delete Super Admin accounts.");
                          return;
                        }
                        setUsers((prev) => prev.filter((x) => x.id !== u.id));
                        setFlash(`Deleted ${u.email} (demo).`);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </StickyActionCell>
              </tr>
            ))}
          </tbody>
        </ScrollTable>
      </div>
    </SuperAdminShell>
  );
}
