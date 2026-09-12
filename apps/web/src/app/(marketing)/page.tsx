"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  GraduationCap,
  Languages,
  Lightbulb,
  LineChart,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import {
  Container,
  Section,
  SectionHeading,
} from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import {
  instructors,
  programs,
  services,
  site,
  valueProps,
} from "@/lib/site-content";

const serviceIcons = [
  GraduationCap,
  LineChart,
  Languages,
  Sparkles,
  Lightbulb,
  BookOpen,
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onHeroSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/programs?q=${encodeURIComponent(q)}` : "/programs");
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-background">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-muted blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[18%] top-8 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-10 right-0 h-80 w-80 rounded-full bg-secondary blur-3xl"
        />

        <Container className="relative grid items-center gap-12 py-14 lg:grid-cols-2 lg:gap-10 lg:py-20">
          <div>
            <motion.p
              className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              {site.name}
            </motion.p>
            <motion.h1
              className="mt-4 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
              Learn. Research.
              <br />
              Succeed.
            </motion.h1>
            <motion.p
              className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              Modern education, professional writing, translation, and
              evidence-based consulting for Somalia and East Africa.
            </motion.p>

            <motion.form
              onSubmit={onHeroSearch}
              className="mt-8 flex max-w-lg items-center gap-2 rounded-full border border-border bg-canvas p-1.5 shadow-[0_18px_40px_-28px_rgba(17,24,39,0.45)]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
            >
              <Search className="ml-3 size-4 shrink-0 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search programs, research, skills…"
                className="h-11 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-text-muted"
              />
              <Button type="submit" className="h-11 shrink-0 rounded-full px-6">
                Search
              </Button>
            </motion.form>

            <motion.div
              className="mt-8 flex items-center gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
            >
              <div className="flex -space-x-2">
                {["AH", "OA", "HY", "AN"].map((initials) => (
                  <span
                    key={initials}
                    className="inline-flex size-9 items-center justify-center rounded-full border-2 border-background bg-primary text-[11px] font-semibold text-primary-foreground"
                  >
                    {initials}
                  </span>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Trusted learners & partners
                </p>
                <p className="text-xs text-muted-foreground">
                  {site.tagline}
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-muted shadow-[0_40px_80px_-36px_rgba(17,24,39,0.5)] sm:aspect-[5/6]">
              <Image
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
                alt="Students learning together"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 480px, 560px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/35 via-transparent to-transparent" />
            </div>

            {/* Floating instructor card */}
            <motion.div
              className="absolute -left-2 bottom-16 z-10 w-[13.5rem] rounded-2xl border border-border bg-card p-3 shadow-[0_20px_50px_-24px_rgba(17,24,39,0.55)] sm:-left-6 sm:w-60 sm:p-3.5"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-3">
                <span className="relative size-11 overflow-hidden rounded-full bg-muted">
                  <Image
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                    alt=""
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </span>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Top instructor
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    Amina Hassan
                  </p>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3 fill-foreground text-foreground" />
                    4.9 · Distance Education
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating program card */}
            <motion.div
              className="absolute -right-1 top-10 z-10 w-[12.5rem] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_20px_50px_-24px_rgba(17,24,39,0.55)] sm:-right-4 sm:w-56"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            >
              <div className="relative h-20 bg-muted">
                <Image
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="224px"
                />
              </div>
              <div className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Featured
                </p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
                  Research Methods
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Proposal writing · Analysis
                </p>
              </div>
            </motion.div>
          </motion.div>
        </Container>
      </section>

      {/* Value props bar */}
      <section className="border-y border-border bg-canvas">
        <Container className="grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4 lg:py-10">
          {valueProps.map((item, i) => {
            const Icon = [Users, BookOpen, LineChart, Award][i] ?? BookOpen;
            return (
              <motion.div
                key={item.title}
                className="flex items-start gap-3"
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.04 }}
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                  <Icon className="size-4 text-foreground" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </Container>
      </section>

      {/* Featured programs */}
      <Section>
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Programs"
              title="Featured learning paths"
              description="Practical programs designed for flexible, high-impact learning."
            />
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/programs">
                View all
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {programs.slice(0, 4).map((program, i) => (
              <motion.article
                key={program.title}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_40px_-32px_rgba(17,24,39,0.45)] transition-shadow hover:shadow-[0_24px_50px_-28px_rgba(17,24,39,0.5)]"
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <Image
                    src={program.image}
                    alt={program.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm">
                    {program.badge}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="size-3.5 fill-foreground text-foreground" />
                    <span className="font-medium text-foreground">
                      {program.rating}
                    </span>
                    <span>· {program.learners} learners</span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">
                    {program.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {program.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                        {program.instructor
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {program.instructor}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {program.category}
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </Container>
      </Section>

      {/* Browse services / categories */}
      <Section className="bg-canvas">
        <Container>
          <SectionHeading
            eyebrow="Services"
            title="Browse by category"
            description="Everything under one knowledge-driven institution."
            align="center"
          />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {services.map((service, i) => {
              const Icon = serviceIcons[i] ?? BookOpen;
              return (
                <motion.div key={service.slug} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.04 }}>
                  <Link
                    href={`/services/${service.slug}`}
                    className="flex h-full flex-col items-center rounded-2xl border border-border bg-card px-4 py-7 text-center shadow-[0_12px_30px_-28px_rgba(17,24,39,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-28px_rgba(17,24,39,0.45)]"
                  >
                    <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted">
                      <Icon className="size-5 text-foreground" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-4 text-sm font-semibold text-foreground">
                      {service.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Explore
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* Instructors */}
      <Section>
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Instructors"
              title="Learn from experienced educators"
              description="Professionals guiding research, language, and skills development."
            />
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/about">About the Academy</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {instructors.map((person, i) => (
              <motion.article
                key={person.name}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_40px_-32px_rgba(17,24,39,0.4)]"
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.05 }}
              >
                <div className="relative aspect-[4/5] bg-muted">
                  <Image
                    src={person.image}
                    alt={person.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {person.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{person.role}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <Star className="size-3.5 fill-foreground text-foreground" />
                      {person.rating}
                    </span>
                    <span>{person.courses} courses</span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA with stats */}
      <Section className="pb-20 pt-4">
        <Container>
          <motion.div
            className="relative overflow-hidden rounded-[1.75rem] bg-primary px-6 py-12 text-primary-foreground sm:px-10 sm:py-14 lg:px-14"
            {...fadeUp}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 top-0 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-primary-foreground/10 blur-3xl"
            />
            <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Unlock your potential with Qalinraac
                </h2>
                <p className="mt-3 max-w-xl text-sm text-primary-foreground/75 sm:text-base">
                  Accessible knowledge, impactful research, and flexible
                  education for a stronger future.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
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
                    Contact us
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                {[
                  { value: "5+", label: "Service areas" },
                  { value: "6+", label: "Learning paths" },
                  { value: "EA", label: "Regional reach" },
                  { value: "100%", label: "Knowledge focus" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="font-display text-3xl font-semibold sm:text-4xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-primary-foreground/70 sm:text-sm">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Container>
      </Section>
    </>
  );
}
