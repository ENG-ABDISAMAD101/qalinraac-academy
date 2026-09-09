"use client";

import { useState } from "react";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { Button } from "@/components/ui/button";
import {
  demoPermissionActions,
  demoPermissionModules,
  demoRolesMatrix,
  type PermissionAction,
  type PermissionModule,
  type RoleMatrixItem,
} from "@/lib/super-admin-demo-data";
import { cn } from "@/lib/utils";

export default function SuperAdminRolesPage() {
  const [roles, setRoles] = useState<RoleMatrixItem[]>(demoRolesMatrix);
  const [selectedId, setSelectedId] = useState(demoRolesMatrix[0].id);
  const selected = roles.find((r) => r.id === selectedId) ?? roles[0];
  const [flash, setFlash] = useState<string | null>(null);

  function togglePermission(module: PermissionModule, action: PermissionAction) {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== selected.id) return role;
        const current = new Set(role.permissions[module] ?? []);
        if (current.has(action)) current.delete(action);
        else current.add(action);
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [module]: Array.from(current) as PermissionAction[],
          },
        };
      }),
    );
    setFlash(`Updated ${selected.name} · ${module} · ${action} (demo).`);
  }

  return (
    <SuperAdminShell>
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary dark:text-foreground">
            Roles & Permissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            RBAC matrix — module and action access (enforced server-side in
            production)
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
          <aside className="card-soft space-y-1 p-3">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={cn(
                  "w-full rounded-xl px-3 py-2.5 text-left text-sm transition",
                  selectedId === r.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent",
                )}
              >
                <p className="font-semibold">{r.name}</p>
                <p
                  className={cn(
                    "text-[11px]",
                    selectedId === r.id
                      ? "text-white/80 dark:text-primary/80"
                      : "text-muted-foreground",
                  )}
                >
                  {r.users} users
                </p>
              </button>
            ))}
            <Button
              type="button"
              variant="outline"
              className="mt-2 w-full"
              onClick={() =>
                setFlash("Create custom role flow (demo placeholder).")
              }
            >
              Create role
            </Button>
          </aside>

          <section className="card-soft space-y-4 p-5">
            <div>
              <h2 className="text-lg font-bold">{selected.name}</h2>
              <p className="text-sm text-muted-foreground">
                {selected.description}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Module</th>
                    {demoPermissionActions.map((a) => (
                      <th key={a} className="px-2 py-2 text-center font-medium">
                        {a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {demoPermissionModules.map((mod) => (
                    <tr key={mod} className="border-b border-border/60">
                      <td className="px-3 py-3 font-semibold">{mod}</td>
                      {demoPermissionActions.map((action) => {
                        const on = (selected.permissions[mod] ?? []).includes(
                          action,
                        );
                        return (
                          <td key={action} className="px-2 py-3 text-center">
                            <button
                              type="button"
                              aria-pressed={on}
                              onClick={() => togglePermission(mod, action)}
                              className={cn(
                                "h-7 w-7 rounded-lg text-xs font-bold",
                                on
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {on ? "✓" : "·"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {flash ? (
              <p className="text-sm text-primary">
                {flash}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </SuperAdminShell>
  );
}
