import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { CartProvider } from "@/lib/cart-context";

export const metadata = {
  title: {
    default: "Qalinraac Academy",
    template: "%s · Qalinraac Academy",
  },
  description:
    "Independent non-profit knowledge institution for modern education, research, writing, translation, skills development, and consulting in Somalia and East Africa.",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col bg-canvas text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </CartProvider>
  );
}
