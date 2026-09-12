import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Container,
  CtaBanner,
  PageHero,
  Section,
} from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { getService, services } from "@/lib/site-content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return { title: "Service" };
  return {
    title: service.title,
    description: service.short,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  return (
    <>
      <PageHero
        eyebrow="Services"
        title={service.title}
        description={service.short}
        actions={
          <>
            <Button asChild>
              <Link href="/contact">Request this service</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/services">All services</Link>
            </Button>
          </>
        }
      />

      <Section>
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            <div className="space-y-5">
              {service.body.map((p) => (
                <p
                  key={p.slice(0, 48)}
                  className="text-base leading-relaxed text-muted-foreground sm:text-[17px]"
                >
                  {p}
                </p>
              ))}
            </div>
            <aside className="h-fit rounded-2xl border border-border bg-card p-7">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Highlights
              </h2>
              <ul className="mt-5 space-y-3">
                {service.highlights.map((item) => (
                  <li
                    key={item}
                    className="border-b border-border/70 pb-3 text-sm text-foreground last:border-0 last:pb-0"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </Container>
      </Section>

      <CtaBanner />
    </>
  );
}
