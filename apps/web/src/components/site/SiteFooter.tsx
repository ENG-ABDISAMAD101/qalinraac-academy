import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { mainNav, services, site } from "@/lib/site-content";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="relative h-10 w-10 overflow-hidden rounded-lg border border-border bg-white">
                <Image
                  src="/qalinraac-acadmy-logo.jpeg"
                  alt={site.name}
                  fill
                  className="object-contain p-0.5"
                  sizes="40px"
                />
              </span>
              <span>
                <span className="block font-display text-lg font-semibold leading-tight">
                  {site.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {site.tagline}
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {site.shortDescription}
            </p>
            <div className="mt-5 space-y-2.5 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                {site.address}
              </p>
              <a
                href={`mailto:${site.email}`}
                className="flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <Mail className="size-4 shrink-0" />
                {site.email}
              </a>
              <a
                href={`tel:${site.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 transition-colors hover:text-foreground"
              >
                <Phone className="size-4 shrink-0" />
                {site.phone}
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold tracking-wide text-foreground">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold tracking-wide text-foreground">
              Services
            </h3>
            <ul className="mt-4 space-y-2.5">
              {services.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold tracking-wide text-foreground">
              Account
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/auth/login"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/register"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Get started
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © {year} {site.name}. All rights reserved.
          </p>
          <p className="font-display text-sm font-semibold text-foreground">
            {site.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
