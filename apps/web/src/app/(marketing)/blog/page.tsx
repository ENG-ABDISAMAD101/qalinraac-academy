import type { Metadata } from "next";
import Link from "next/link";
import {
  Container,
  CtaBanner,
  PageHero,
  Section,
} from "@/components/site/Section";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on education, research, writing, and knowledge development from Qalinraac Academy.",
};

const posts = [
  {
    title: "Why research culture matters for East Africa",
    excerpt:
      "Building evidence-based solutions starts with accessible research skills and institutional support.",
    date: "Sep 2026",
  },
  {
    title: "Distance education that fits real schedules",
    excerpt:
      "Live classes and recorded lessons help learners grow without leaving their communities behind.",
    date: "Aug 2026",
  },
  {
    title: "Quality translation as a development tool",
    excerpt:
      "Accurate Somali–English and Arabic–Somali language services strengthen knowledge sharing.",
    date: "Jul 2026",
  },
];

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Ideas, insights, and academy updates"
        description="Articles on education, research, language services, and skills development."
      />
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl space-y-4">
            {posts.map((post) => (
              <article
                key={post.title}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {post.date}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-foreground">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
                <Button asChild variant="link" className="mt-3 px-0">
                  <Link href="/contact">Talk to us about this topic</Link>
                </Button>
              </article>
            ))}
          </div>
        </Container>
      </Section>
      <CtaBanner />
    </>
  );
}
