import type { Metadata } from "next";
import Link from "next/link";
import {
  Container,
  CtaBanner,
  PageHero,
  Section,
  SectionHeading,
} from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { aboutParagraphs, site, values } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "About",
  description: site.shortDescription,
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="About Qalinraac Academy"
        description="An independent, non-profit knowledge institution dedicated to quality research, modern education, professional writing, translation, skills development, and evidence-based consulting."
        actions={
          <>
            <Button asChild>
              <Link href="/contact">Contact us</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/services">Explore services</Link>
            </Button>
          </>
        }
      />

      <Section>
        <Container>
          <div className="mx-auto max-w-3xl space-y-6">
            {aboutParagraphs.slice(0, 4).map((p) => (
              <p
                key={p.slice(0, 40)}
                className="text-base leading-relaxed text-muted-foreground sm:text-[17px]"
              >
                {p}
              </p>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="vision" className="border-y border-border bg-background">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                eyebrow="Vision"
                title="A leading center for knowledge across Somalia and East Africa"
                description="Our vision is to become a leading center for modern education, high-quality research, innovation, professional writing, translation, and evidence-based consulting in Somalia and East Africa."
              />
            </div>
            <div>
              <SectionHeading
                eyebrow="Belief"
                title="Knowledge should be accessible"
                description="At Qalinraac Academy, we believe that knowledge should be accessible, research should create impact, and education should empower people to build a better future."
              />
              <p className="mt-8 font-display text-2xl font-semibold text-foreground">
                {site.tagline}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="mx-auto max-w-3xl space-y-6">
            {aboutParagraphs.slice(4, 7).map((p) => (
              <p
                key={p.slice(0, 40)}
                className="text-base leading-relaxed text-muted-foreground sm:text-[17px]"
              >
                {p}
              </p>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="values" className="border-y border-border bg-background">
        <Container>
          <SectionHeading
            eyebrow="Values"
            title="What guides our work"
            description="Meaningful development requires collaboration, continuous learning, innovation, and the responsible use of knowledge and technology."
            align="center"
          />
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border border-border bg-canvas p-6"
              >
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="partnerships">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16">
            <div>
              <SectionHeading
                eyebrow="Partnerships"
                title="Building lasting collaborations"
                description="Qalinraac Academy seeks to build lasting partnerships with universities, research institutions, government agencies, private organizations, civil society organizations, international organizations, professionals, and development partners."
              />
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Through collaboration, we aim to strengthen education, research,
                innovation, institutional capacity, and knowledge sharing across
                Somalia and East Africa.
              </p>
              <div className="mt-8">
                <Button asChild>
                  <Link href="/contact">Start a partnership</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                We partner with
              </p>
              <ul className="mt-4 space-y-3 text-sm text-foreground">
                {[
                  "Universities & research institutions",
                  "Government agencies",
                  "Private organizations",
                  "Civil society organizations",
                  "International & development partners",
                  "Professionals & educators",
                ].map((item) => (
                  <li
                    key={item}
                    className="border-b border-border/70 pb-3 last:border-0 last:pb-0"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <CtaBanner />
    </>
  );
}
