"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { NotificationsMenu } from "@/components/student/NotificationsMenu";
import { SiteCartDrawer } from "@/components/site/SiteCartDrawer";
import { SiteProfileMenu } from "@/components/site/SiteProfileMenu";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { mainNav, site } from "@/lib/site-content";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { open, setOpen, itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-[4.25rem] lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="relative h-9 w-9 overflow-hidden rounded-full border border-border bg-white">
              <Image
                src="/qalinraac-acadmy-logo.jpeg"
                alt={site.name}
                fill
                className="object-contain p-0.5"
                sizes="36px"
                priority
              />
            </span>
            <span className="hidden font-display text-[15px] font-semibold tracking-tight text-foreground sm:block">
              Qalinraac
            </span>
          </Link>

          <nav className="mx-auto hidden items-center gap-0.5 lg:flex">
            {mainNav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/10",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative size-10 rounded-full"
              aria-label="Open cart"
              onClick={() => setOpen(true)}
            >
              <ShoppingBag className="size-6" strokeWidth={1.75} />
              {itemCount > 0 ? (
                <span className="absolute right-1 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              ) : null}
            </Button>

            <ThemeToggle
              className="size-10 border-transparent bg-transparent shadow-none hover:bg-black/5 dark:hover:bg-white/10"
              iconClassName="!h-6 !w-6"
            />

            {loading ? (
              <div
                className="flex items-center gap-2"
                aria-hidden
                aria-busy="true"
              >
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="h-9 w-[4.5rem] animate-pulse rounded-full bg-muted" />
                  <div className="h-9 w-[6.5rem] animate-pulse rounded-full bg-muted" />
                </div>
                <div className="flex items-center gap-2 sm:hidden">
                  <div className="size-9 animate-pulse rounded-full bg-muted" />
                  <div className="size-9 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            ) : user ? (
              <>
                <NotificationsMenu />
                <SiteProfileMenu />
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden rounded-full sm:inline-flex"
                >
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="hidden rounded-full sm:inline-flex"
                >
                  <Link href="/auth/register">Get started</Link>
                </Button>
              </>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-border bg-background lg:hidden">
            <div className="mx-auto max-h-[calc(100dvh-4rem)] max-w-7xl overflow-y-auto px-4 py-4 sm:px-6">
              <div className="space-y-1">
                {mainNav.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "block rounded-xl px-3 py-3 text-sm font-semibold",
                        active ? "bg-muted text-foreground" : "text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              {!loading && !user ? (
                <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:hidden">
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <Link href="/auth/login">Sign in</Link>
                  </Button>
                  <Button asChild className="w-full rounded-full">
                    <Link href="/auth/register">Get started</Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </header>

      <div className="h-16 lg:h-[4.25rem]" aria-hidden />

      <SiteCartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
