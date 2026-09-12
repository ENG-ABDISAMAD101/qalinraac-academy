"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock3,
  Minus,
  Play,
  Plus,
  ShoppingBag,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/spinner";
import {
  getApiErrorMessage,
  mediaPublicUrl,
  publicCourseDetailRequest,
  type PublicCourseDetail,
} from "@/lib/api";
import { formatMoney, useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

function levelLabel(level: string) {
  return level.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const idOrSlug = params.id;
  const { addItem, hasItem } = useCart();
  const [course, setCourse] = useState<PublicCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void publicCourseDetailRequest(idOrSlug)
      .then((data) => {
        if (!cancelled) {
          setCourse(data);
          setOpenSections(data.sections.map((s) => s.id));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Course not found"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [idOrSlug]);

  function toggleExpandAll() {
    if (!course) return;
    setOpenSections((prev) =>
      prev.length === course.sections.length
        ? []
        : course.sections.map((s) => s.id),
    );
  }

  if (loading) return <PageLoader label="Loading course" />;
  if (error || !course) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-destructive">{error ?? "Course not found"}</p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/courses">Back to courses</Link>
        </Button>
      </div>
    );
  }

  const thumb = mediaPublicUrl(course.thumbnailUrl);
  const instructor = course.instructor;
  const instructorAvatar = mediaPublicUrl(instructor?.avatarUrl);
  const inCart = hasItem(course.id);

  function toCartItem() {
    return {
      id: course!.id,
      slug: course!.slug || course!.id,
      title: course!.title,
      thumbnailUrl: course!.thumbnailUrl,
      instructorName: instructor?.fullName ?? "Instructor",
      priceCents: course!.priceCents,
      currency: course!.currency,
      accessLabel: course!.accessLabel,
      level: course!.level,
      description: course!.shortDescription || course!.description,
    };
  }

  return (
    <div className="border-b border-border bg-canvas">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.35fr_0.85fr] lg:gap-10 lg:px-8 lg:py-14">
        {/* Left */}
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <span className="rounded-full border border-border bg-card px-3 py-1 text-foreground">
              {levelLabel(course.level)}
            </span>
            <span className="rounded-full border border-border bg-card px-3 py-1 text-muted-foreground">
              {course.category}
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {course.shortDescription || course.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6 border-y border-border py-5">
            <div className="flex items-center gap-3">
              <Avatar className="size-11 border border-border">
                <AvatarImage src={instructorAvatar} alt="" />
                <AvatarFallback>
                  {(instructor?.fullName ?? "IN")
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {instructor?.fullName ?? "Instructor"}
                </p>
                <p className="text-xs text-muted-foreground">Instructor</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {course.lessonCount} lessons
              </p>
              <p className="text-xs text-muted-foreground">Total lessons</p>
            </div>
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {course.durationLabel}
                </p>
                <p className="text-xs text-muted-foreground">Total time</p>
              </div>
            </div>
          </div>

          <section className="mt-10">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              What you&apos;ll learn
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {(course.learningOutcomes.length
                ? course.learningOutcomes
                : [
                    "Build practical skills through structured lessons",
                    "Apply concepts with guided exercises",
                    "Learn from experienced instructors",
                    "Earn a certificate of completion",
                  ]
              ).map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {course.targetAudience.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Is this course for you?
              </h2>
              <ul className="mt-5 space-y-3">
                {course.targetAudience.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2.5 text-sm text-foreground"
                  >
                    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground">
                  Curriculum
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {course.sectionCount} sections · {course.lessonCount} lessons ·{" "}
                  {course.durationLabel} total
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={toggleExpandAll}
              >
                {openSections.length === course.sections.length &&
                course.sections.length > 0
                  ? "Collapse all"
                  : "Expand all"}
              </Button>
            </div>

            <Accordion
              type="multiple"
              value={openSections}
              onValueChange={setOpenSections}
              className="mt-6 space-y-3"
            >
              {course.sections.map((section) => (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger
                    className="px-4 py-4 pr-4"
                    hideChevron
                  >
                    <div className="flex flex-1 items-start gap-3 text-left">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {String(section.index).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">
                          {section.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {section.lessonCount} lessons · {section.durationLabel}
                          {section.freePreviewCount > 0
                            ? ` · ${section.freePreviewCount} free preview${section.freePreviewCount === 1 ? "" : "s"}`
                            : ""}
                        </p>
                      </div>
                      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                        <Plus className="size-3.5 text-foreground group-data-[state=open]:hidden" />
                        <Minus className="hidden size-3.5 text-foreground group-data-[state=open]:block" />
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <ul className="space-y-2 border-t border-border pt-3">
                      {section.lessons.map((lesson) => (
                        <li
                          key={lesson.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-foreground">{lesson.title}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {lesson.isPreview ? "Preview · " : ""}
                            {lesson.durationLabel}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {course.sections.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Curriculum will appear once modules are published.
              </p>
            ) : null}
          </section>
        </div>

        {/* Right sticky card */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-36px_rgba(17,24,39,0.45)]">
            <div className="relative aspect-video bg-muted">
              {thumb ? (
                <Image
                  src={thumb}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="420px"
                  priority
                />
              ) : null}
              <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                <a
                  href={course.promoVideoUrl || undefined}
                  target={course.promoVideoUrl ? "_blank" : undefined}
                  rel="noreferrer"
                  className={cn(
                    "inline-flex size-14 items-center justify-center rounded-full bg-background text-foreground shadow-lg",
                    !course.promoVideoUrl && "pointer-events-none opacity-90",
                  )}
                  aria-label="Watch preview"
                >
                  <Play className="size-5 fill-foreground" />
                </a>
              </div>
            </div>

            <div className="p-5">
              <p className="text-3xl font-semibold text-foreground">
                {course.isFree
                  ? "Free"
                  : formatMoney(course.priceCents, course.currency)}
              </p>
              {course.listPriceCents > course.priceCents ? (
                <p className="mt-1 text-sm text-muted-foreground line-through">
                  {formatMoney(course.listPriceCents, course.currency)}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-muted-foreground">
                Level: {levelLabel(course.level)} · {course.accessLabel}
              </p>

              <div className="mt-5 grid gap-2">
                <Button
                  type="button"
                  className="h-11 w-full rounded-full"
                  onClick={() => {
                    addItem(toCartItem(), false);
                    window.location.href = `/checkout?course=${course.id}`;
                  }}
                >
                  Enroll now
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-full"
                  onClick={() => addItem(toCartItem(), true)}
                >
                  <ShoppingBag className="size-4" />
                  {inCart ? "Added to cart" : "Add to cart"}
                </Button>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground">
                  What&apos;s included
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {course.included.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="size-4 shrink-0 text-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
