"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Lock,
  Smartphone,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import { authLoginHref } from "@/lib/auth-routes";
import { useAuth } from "@/lib/auth-context";
import {
  checkoutCourseRequest,
  getApiErrorMessage,
  mediaPublicUrl,
  publicCourseDetailRequest,
} from "@/lib/api";
import {
  formatMoney,
  useCart,
  type CartCourse,
} from "@/lib/cart-context";
import { cn } from "@/lib/utils";

type PayMethod = "evc" | "zaad" | "sahal" | "card";

const METHODS: {
  id: PayMethod;
  title: string;
  subtitle: string;
  provider: "waafi" | "stripe" | "manual";
}[] = [
  {
    id: "evc",
    title: "EVC Plus",
    subtitle: "Hormuud mobile money",
    provider: "waafi",
  },
  {
    id: "zaad",
    title: "ZAAD",
    subtitle: "Telesom mobile money",
    provider: "waafi",
  },
  {
    id: "sahal",
    title: "Sahal",
    subtitle: "Golis mobile money",
    provider: "waafi",
  },
  {
    id: "card",
    title: "Card",
    subtitle: "Credit / Debit · Visa, Mastercard",
    provider: "stripe",
  },
];

function levelLabel(level: string) {
  return level.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseParam = searchParams.get("course");
  const { user, loading: authLoading } = useAuth();
  const { items, clearCart, addItem } = useCart();

  const [courseExtra, setCourseExtra] = useState<CartCourse | null>(null);
  const [method, setMethod] = useState<PayMethod>("evc");
  const [phone, setPhone] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountCents, setDiscountCents] = useState(0);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const isLocalPayment = method !== "card";

  useEffect(() => {
    if (!courseParam) return;
    let cancelled = false;
    void publicCourseDetailRequest(courseParam)
      .then((c) => {
        if (cancelled) return;
        const item: CartCourse = {
          id: c.id,
          slug: c.slug || c.id,
          title: c.title,
          thumbnailUrl: c.thumbnailUrl,
          instructorName: c.instructor?.fullName ?? "Instructor",
          priceCents: c.priceCents,
          currency: c.currency,
          accessLabel: c.accessLabel,
          level: c.level,
          description: c.shortDescription || c.description,
        };
        setCourseExtra(item);
        addItem(item, false);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [courseParam, addItem]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const redirect = courseParam
        ? `/checkout?course=${encodeURIComponent(courseParam)}`
        : "/checkout";
      router.replace(authLoginHref(redirect));
    }
  }, [authLoading, user, router, courseParam]);

  const orderItems = useMemo(() => {
    if (courseExtra && items.every((i) => i.id !== courseExtra.id)) {
      return [courseExtra, ...items];
    }
    if (courseParam) {
      const match = items.find((i) => i.id === courseParam || i.slug === courseParam);
      if (match) return [match];
      if (courseExtra) return [courseExtra];
    }
    return items;
  }, [items, courseExtra, courseParam]);

  const subtotal = orderItems.reduce((s, i) => s + i.priceCents, 0);
  const total = Math.max(0, subtotal - discountCents);
  const currency = orderItems[0]?.currency ?? "USD";
  const primary = orderItems[0];
  const backHref = primary
    ? `/courses/${primary.slug || primary.id}`
    : "/courses";

  function applyDiscount() {
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setDiscountCents(0);
      return;
    }
    if (code === "QALIN15" || code === "SAVE15") {
      setDiscountCents(Math.min(subtotal, 1500));
      setError(null);
      return;
    }
    setDiscountCents(0);
    setError("Invalid discount code");
  }

  async function pay() {
    if (!user || !primary) return;

    const normalizedPhone = phone.replace(/\s+/g, "");
    if (isLocalPayment) {
      if (!/^252\d{9}$/.test(normalizedPhone)) {
        setError("Enter a valid phone number like 252XXXXXXXXX");
        return;
      }
    }

    setPaying(true);
    setError(null);
    try {
      // Real gateways later — checkout enrolls + activates access now.
      for (const item of orderItems) {
        await checkoutCourseRequest({
          courseId: item.id,
          paymentMethod: method,
          phone: isLocalPayment ? normalizedPhone : undefined,
        });
      }
      clearCart();
      setDone(true);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Could not complete enrollment. Please try again."),
      );
    } finally {
      setPaying(false);
    }
  }

  if (authLoading || (!user && !done)) {
    return <PageLoader label="Preparing checkout" />;
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <CheckCircle2 className="mx-auto size-12 text-foreground" />
        <h1 className="mt-4 font-display text-3xl font-semibold">
          Enrollment successful
        </h1>
        <p className="mt-2 text-muted-foreground">
          You are registered for this course. Access is ready in your student
          dashboard.
        </p>
        <Button asChild className="mt-8 rounded-full">
          <Link href="/student/courses">Go to my courses</Link>
        </Button>
      </div>
    );
  }

  if (!primary) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/courses">Browse courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="border-b border-border bg-canvas">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to course
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold text-foreground">
          Checkout
        </h1>
        <p className="mt-2 text-muted-foreground">
          Review your order and complete your purchase.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
          {/* Left */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                1 · Your course
              </p>
              <div className="mt-4 flex gap-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {mediaPublicUrl(primary.thumbnailUrl) ? (
                    <Image
                      src={mediaPublicUrl(primary.thumbnailUrl)!}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground">
                    {primary.title}
                  </h2>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {levelLabel(primary.level)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {primary.description || "Professional course enrollment"}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-foreground">
                    {formatMoney(primary.priceCents, primary.currency)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                2 · Access duration
              </p>
              <p className="mt-3 text-base font-semibold text-foreground">
                {primary.accessLabel} Access
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                3 · Payment method
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Mobile money</p>
              <div className="mt-4 space-y-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                      method === m.id
                        ? "border-foreground bg-muted/50"
                        : "border-border hover:bg-muted/30",
                    )}
                  >
                    <span className="inline-flex size-9 items-center justify-center rounded-lg bg-muted">
                      {m.id === "card" ? (
                        <CreditCard className="size-4" />
                      ) : (
                        <Smartphone className="size-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">
                        {m.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {m.subtitle}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "size-4 rounded-full border",
                        method === m.id
                          ? "border-foreground bg-foreground"
                          : "border-border",
                      )}
                    />
                  </button>
                ))}
              </div>

              {isLocalPayment ? (
                <div className="mt-5 space-y-2 border-t border-border pt-5">
                  <Label htmlFor="checkout-phone">Phone number</Label>
                  <Input
                    id="checkout-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="252XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    You&apos;ll receive a payment prompt on this number.
                  </p>
                </div>
              ) : null}
            </section>
          </div>

          {/* Right summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Order summary
              </h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium text-foreground">
                    {formatMoney(subtotal, currency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd className="font-medium text-foreground">
                    {discountCents
                      ? `-${formatMoney(discountCents, currency)}`
                      : formatMoney(0, currency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Access</dt>
                  <dd className="font-medium text-foreground">
                    {primary.accessLabel} Access
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex gap-2">
                <Input
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Discount code"
                  className="rounded-full"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={applyDiscount}
                >
                  Apply
                </Button>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-semibold text-foreground">
                  {formatMoney(total, currency)}
                </span>
              </div>

              <div className="mt-5 rounded-xl bg-muted/60 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Before you pay
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Confirm this course matches your goals. You will get instant
                  access after successful payment.
                </p>
              </div>

              {error ? (
                <p className="mt-3 text-sm text-destructive">{error}</p>
              ) : null}

              <Button
                type="button"
                className="mt-5 h-12 w-full rounded-full"
                disabled={paying}
                onClick={() => void pay()}
              >
                {paying ? (
                  <>
                    <Spinner className="size-4" />
                    Processing…
                  </>
                ) : (
                  `Pay ${formatMoney(total, currency)}`
                )}
              </Button>

              <div className="mt-5 space-y-2 border-t border-border pt-4 text-center text-xs text-muted-foreground">
                <p className="inline-flex items-center gap-1.5">
                  <Lock className="size-3.5" />
                  Secure payment · SSL encrypted
                </p>
                <p>Powered by trusted payment partners</p>
                <div className="flex items-center justify-center gap-4 pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Lock className="size-3.5" /> Secure
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Zap className="size-3.5" /> Instant access
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading checkout" />}>
      <CheckoutContent />
    </Suspense>
  );
}
