import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  Container,
  CtaBanner,
  PageHero,
  Section,
} from "@/components/site/Section";
import { services } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Distance education, research, writing & translation, skills development, and evidence-based consulting.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Knowledge-driven services for real-world needs"
        description="Qalinraac Academy brings together research, distance education, professional writing, translation, innovation, and advisory services under one institution."
      />

      <Section>
        <Container>
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group rounded-2xl border border-border bg-card p-7 transition-colors hover:border-foreground/20 hover:bg-muted/40"
              >
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  {service.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {service.short}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  View service
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBanner />
    </>
  );
}
