import type { Metadata } from "next";
import Link from "next/link";
import {
  Container,
  CtaBanner,
  PageHero,
  Section,
} from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Academic",
  description:
    "Academic programs, distance education, research culture, and professional learning at Qalinraac Academy.",
};

export default function AcademicPublicPage() {
  return (
    <>
      <PageHero
        eyebrow="Academic"
        title="Academic excellence through modern learning"
        description="Strengthen research culture, distance education, and professional development with flexible programs designed for real-world impact."
        actions={
          <>
            <Button asChild className="rounded-full">
              <Link href="/programs">View programs</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/courses">Browse courses</Link>
            </Button>
          </>
        }
      />
      <Section>
        <Container>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-muted/40"
              >
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {service.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {service.short}
                </p>
              </Link>
            ))}
          </div>
        </Container>
      </Section>
      <CtaBanner />
    </>
  );
}
