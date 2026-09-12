"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import {
  Container,
  PageHero,
  Section,
} from "@/components/site/Section";
import { Button } from "@/components/ui/button";
import { PageLoader, Spinner } from "@/components/ui/spinner";
import {
  getApiErrorMessage,
  mediaPublicUrl,
  publicCoursesRequest,
  type PublicCourseListItem,
} from "@/lib/api";
import { formatMoney, useCart } from "@/lib/cart-context";

function levelLabel(level: string) {
  return level.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function CoursesContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const { addItem, hasItem } = useCart();
  const [courses, setCourses] = useState<PublicCourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void publicCoursesRequest(q || undefined)
      .then((data) => {
        if (!cancelled) setCourses(data.items ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err, "Failed to load courses"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <>
      <PageHero
        eyebrow="Courses"
        title="Explore our courses"
        description="Professional courses with real instructors, flexible access, and practical learning outcomes."
      />

      <Section>
        <Container>
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner className="center" label="Loading courses" />
            </div>
          ) : error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : courses.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              {q
                ? `No courses matched “${q}”.`
                : "No published courses are available yet."}
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const thumb = mediaPublicUrl(course.thumbnailUrl);
                return (
                  <article
                    key={course.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_40px_-32px_rgba(17,24,39,0.35)]"
                  >
                    <Link
                      href={`/courses/${course.slug || course.id}`}
                      className="relative aspect-[16/10] bg-muted"
                    >
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt={course.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : null}
                      <span className="absolute left-3 top-3 rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                        {course.category}
                      </span>
                      <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                        {levelLabel(course.level)}
                      </span>
                    </Link>

                    <div className="flex flex-1 flex-col p-5">
                      <Link href={`/courses/${course.slug || course.id}`}>
                        <h2 className="font-display text-xl font-semibold leading-snug text-foreground">
                          {course.title}
                        </h2>
                      </Link>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {course.description || "Professional learning path."}
                      </p>
                      <p className="mt-3 text-sm text-muted-foreground">
                        by{" "}
                        <span className="font-medium text-foreground">
                          {course.instructor?.fullName ?? "Instructor"}
                        </span>
                      </p>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-foreground">
                            {course.isFree
                              ? "Free"
                              : formatMoney(course.priceCents, course.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {course.accessLabel} · {course.durationLabel}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center gap-2">
                        <Button asChild className="flex-1 rounded-full">
                          <Link href={`/courses/${course.slug || course.id}`}>
                            Enroll Now
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-10 shrink-0 rounded-full"
                          aria-label={
                            hasItem(course.id) ? "Already in cart" : "Add to cart"
                          }
                          onClick={() =>
                            addItem({
                              id: course.id,
                              slug: course.slug || course.id,
                              title: course.title,
                              thumbnailUrl: course.thumbnailUrl,
                              instructorName:
                                course.instructor?.fullName ?? "Instructor",
                              priceCents: course.priceCents,
                              currency: course.currency,
                              accessLabel: course.accessLabel,
                              level: course.level,
                              description: course.description,
                            })
                          }
                        >
                          <ShoppingBag className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading courses" />}>
      <CoursesContent />
    </Suspense>
  );
}
