import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import {
  Container,
  CtaBanner,
  PageHero,
  Section,
  SectionHeading,
} from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { programs } from "@/lib/site-content";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Distance learning, research methods, academic writing, translation, leadership, and professional development programs.",
};

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();
  const filtered = query
    ? programs.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query),
      )
    : programs;

  return (
    <>
      <PageHero
        eyebrow="Programs"
        title="Flexible learning for every schedule"
        description="Our Distance Education programs use modern digital learning technologies — live online classes, recorded lessons, and professional training designed for learners anywhere."
        actions={
          <>
            <Button asChild className="rounded-full">
              <Link href="/auth/register">Enroll now</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/contact">Ask about a program</Link>
            </Button>
          </>
        }
      />

      <Section>
        <Container>
          <SectionHeading
            title={query ? `Results for “${q}”` : "Featured learning paths"}
            description={
              query
                ? `${filtered.length} program${filtered.length === 1 ? "" : "s"} found.`
                : "Programs that strengthen research culture, professional language skills, and practical capabilities."
            }
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((program) => (
              <article
                key={program.title}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_40px_-32px_rgba(17,24,39,0.4)]"
              >
                <div className="relative aspect-[16/10] bg-muted">
                  <Image
                    src={program.image}
                    alt={program.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                    {program.badge}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3.5 fill-foreground text-foreground" />
                    <span className="font-medium text-foreground">
                      {program.rating}
                    </span>
                    <span>· {program.learners} learners</span>
                  </div>
                  <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
                    {program.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {program.description}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-xs font-medium text-foreground">
                      {program.instructor}
                    </span>
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <Link href="/auth/register">Get started</Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {filtered.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              No programs matched your search.{" "}
              <Link href="/programs" className="font-semibold text-foreground underline">
                Clear search
              </Link>
            </p>
          ) : null}
        </Container>
      </Section>

      <CtaBanner />
    </>
  );
}
