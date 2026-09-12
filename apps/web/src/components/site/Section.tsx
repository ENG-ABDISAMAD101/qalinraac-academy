import Link from "next/link";
import { cn } from "@/lib/utils";

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("py-16 sm:py-20 lg:py-24", className)}>
      {children}
    </section>
  );
}

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl",
          eyebrow && "mt-3",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-[17px]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border-b border-border bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-0 h-56 w-56 rounded-full bg-muted blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-10 top-8 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
      />
      <Container className="relative py-16 sm:py-20 lg:py-24">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "max-w-4xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl",
            eyebrow && "mt-3",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        ) : null}
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
      </Container>
    </div>
  );
}

export function CtaBanner() {
  return (
    <Section className="pb-20 pt-4">
      <Container>
        <div className="relative overflow-hidden rounded-[1.75rem] bg-primary px-6 py-12 text-primary-foreground sm:px-10 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl"
          />
          <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Ready to learn, research, and grow?
              </h2>
              <p className="mt-3 text-base text-primary-foreground/75 sm:text-lg">
                Join Qalinraac Academy for flexible distance education, research
                support, and professional knowledge services.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/register"
                className="inline-flex h-11 items-center justify-center rounded-full bg-background px-6 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
              >
                Get started now
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center rounded-full border border-primary-foreground/25 px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
