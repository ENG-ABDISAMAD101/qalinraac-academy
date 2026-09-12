import type { Metadata } from "next";
import Link from "next/link";
import {
  Container,
  CtaBanner,
  PageHero,
  Section,
} from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { getService } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Research",
  description:
    "Research development, proposal writing, data analysis, academic writing, and reporting support from Qalinraac Academy.",
};

export default function ResearchPublicPage() {
  const research = getService("research");

  return (
    <>
      <PageHero
        eyebrow="Research"
        title="Research that creates impact"
        description="We support researchers, students, universities, government institutions, private organizations, and development partners through professional research services."
        actions={
          <>
            <Button asChild className="rounded-full">
              <Link href="/services/research">Research services</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/contact">Partner with us</Link>
            </Button>
          </>
        }
      />

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            <div className="space-y-5">
              {(research?.body ?? []).map((p) => (
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
                What we support
              </h2>
              <ul className="mt-5 space-y-3">
                {(research?.highlights ?? []).map((item) => (
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
