"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMoney, useCart } from "@/lib/cart-context";
import { mediaPublicUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type SiteCartDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function SiteCartDrawer({ open, onClose }: SiteCartDrawerProps) {
  const router = useRouter();
  const { items, itemCount, subtotalCents, removeItem, clearCart } = useCart();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function browseCourses() {
    onClose();
    router.push("/courses");
  }

  function checkout() {
    onClose();
    router.push("/checkout");
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] transition-[visibility]",
        open ? "visible" : "invisible",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close cart"
        className={cn(
          "absolute inset-0 bg-primary/25 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-md flex-col rounded-l-2xl bg-background shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-lg font-semibold text-foreground">Your cart</h2>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-foreground transition-colors hover:bg-muted"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-muted">
              <ShoppingBag className="size-6" strokeWidth={1.75} />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-foreground">
              Your cart is empty
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Browse our catalog and add courses to get started.
            </p>
            <Button
              type="button"
              className="mt-8 h-12 w-full max-w-xs rounded-full"
              onClick={browseCourses}
            >
              Browse Courses
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {items.map((item) => {
                const thumb = mediaPublicUrl(item.thumbnailUrl);
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-2xl border border-border p-3"
                  >
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {item.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {item.instructorName}
                          </p>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${item.title}`}
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => removeItem(item.id)}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatMoney(item.priceCents, item.currency)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">
                  {formatMoney(subtotalCents, items[0]?.currency ?? "USD")}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Access duration shown at checkout
              </p>
              <Button
                type="button"
                className="mt-4 h-12 w-full rounded-full"
                onClick={checkout}
              >
                Checkout
              </Button>
              <button
                type="button"
                className="mt-3 w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={clearCart}
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
