"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { LogOut, PanelLeft, PanelLeftClose, Search, Settings } from "lucide-react";
import { PortalCommandMenu } from "@/components/portal/PortalCommandMenu";
import { PortalHeader } from "@/components/portal/PortalHeader";
import type {
  PortalNavItem,
  PortalNavSection,
} from "@/components/portal/portal-types";
import { useSidebarCollapsed } from "@/components/portal/use-sidebar-collapsed";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { mediaPublicUrl } from "@/lib/api";
import { cn, initialsFromName } from "@/lib/utils";

export function PortalChrome({
  children,
  sections,
  commandPages,
  portalLabel,
  roleLabel,
  dashboardHref,
  profileHref,
  collapseStorageKey,
  searchPlaceholder,
  notifications,
  profileMenu,
  user,
  usingDemo,
  logout,
  demoNote,
  contentClassName,
  beforeHeader,
}: {
  children: ReactNode;
  sections: PortalNavSection[];
  commandPages: PortalNavItem[];
  portalLabel: string;
  /** Shown above the name in the sidebar footer, e.g. "Instructor". */
  roleLabel?: string;
  dashboardHref: string;
  profileHref: string;
  collapseStorageKey: string;
  searchPlaceholder?: string;
  notifications: ReactNode;
  profileMenu: ReactNode;
  user: {
    fullName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  };
  usingDemo?: boolean;
  logout: () => void;
  demoNote?: string;
  contentClassName?: string;
  beforeHeader?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const [collapsed, setCollapsed] = useSidebarCollapsed(collapseStorageKey);

  const filteredSections = useMemo(() => {
    const q = navQuery.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const hay = [item.label, item.href, ...(item.keywords ?? [])]
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [navQuery, sections]);

  const name = user.fullName?.trim() || portalLabel;
  const email = user.email ?? "—";
  const avatarSrc = mediaPublicUrl(user.avatarUrl);
  const initials = initialsFromName(name);

  return (
    <div className="min-h-screen bg-canvas">
      {beforeHeader}
      <PortalHeader
        dashboardHref={dashboardHref}
        commandOpen={commandOpen}
        onCommandOpenChange={setCommandOpen}
        searchPlaceholder={searchPlaceholder}
        notifications={notifications}
        profile={profileMenu}
      />
      <div className={cn("mx-auto flex max-w-[1440px]", contentClassName)}>
        <aside
          className={cn(
            "sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-r border-border bg-background transition-[width] duration-200 md:flex",
            collapsed ? "w-[72px]" : "w-[260px]",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 pb-3 pt-4",
              collapsed ? "justify-center px-2" : "px-3",
            )}
          >
            {!collapsed ? (
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search navigation</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={navQuery}
                  onChange={(e) => setNavQuery(e.target.value)}
                  placeholder="Search navigation..."
                  className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
            ) : null}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              {collapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>
          </div>

          <nav
            className={cn(
              "scrollbar-sidebar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-3",
              collapsed ? "items-center px-2" : "px-3",
            )}
          >
            {filteredSections.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                No matches
              </p>
            ) : (
              filteredSections.map((section) => (
                <div
                  key={section.title}
                  className={cn(
                    "space-y-1",
                    collapsed && "flex w-full flex-col items-center",
                  )}
                >
                  {!collapsed ? (
                    <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {section.title}
                    </p>
                  ) : (
                    <span className="sr-only">{section.title}</span>
                  )}
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={item.label}
                        aria-label={item.label}
                        className={cn(
                          "flex items-center font-medium transition-colors",
                          collapsed
                            ? "size-10 justify-center rounded-full"
                            : "gap-3 rounded-full px-3 py-2.5 text-sm",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                        {!collapsed ? (
                          <span className="truncate">{item.label}</span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              ))
            )}
          </nav>

          <div
            className={cn(
              "shrink-0 space-y-1 border-t border-border py-3",
              collapsed ? "flex flex-col items-center px-2" : "px-3",
            )}
          >
            {!collapsed ? (
              <div className="space-y-2 px-2">
                {roleLabel ? (
                  <div className="flex items-center gap-1.5">
                    <span className="block h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span className="truncate text-[12px] font-medium text-muted-foreground">
                      {roleLabel}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={avatarSrc} alt={name} />
                    <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold leading-tight text-foreground">
                      {name}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                      {email}
                    </p>
                  </div>
                  <Link
                    href={profileHref}
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Open profile settings"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                href={profileHref}
                title={roleLabel ? `${roleLabel} · ${name}` : name}
                aria-label={name}
                className="flex size-10 items-center justify-center"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarSrc} alt={name} />
                  <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                </Avatar>
              </Link>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title="Logout"
              aria-label="Logout"
              className={cn(
                "text-muted-foreground",
                collapsed
                  ? "size-10 rounded-full p-0"
                  : "h-9 w-full justify-start rounded-full px-3 text-sm",
              )}
              onClick={() => {
                logout();
                router.push("/auth/login");
              }}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed ? "Logout" : null}
            </Button>
            {usingDemo && !collapsed ? (
              <p className="px-2 text-[10px] leading-relaxed text-muted-foreground">
                {demoNote ?? `Demo mode — ${portalLabel.toLowerCase()}.`}
              </p>
            ) : null}
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <PortalCommandMenu
        open={commandOpen}
        onOpenChange={setCommandOpen}
        pages={commandPages}
        portalLabel={portalLabel}
      />
    </div>
  );
}
