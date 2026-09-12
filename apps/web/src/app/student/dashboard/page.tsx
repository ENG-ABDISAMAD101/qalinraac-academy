"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ComponentType } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  Target,
} from "lucide-react";
import { StudentShell } from "@/components/student/StudentShell";
import { EnrolledCourseCard } from "@/components/student/StudentCourseCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  mediaPublicUrl,
  studentDashboardRequest,
  type StudentDashboardData,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { displayStudentName, greetingForHour } from "@/lib/utils";

type StatItem = {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

function SummaryStatsGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-canvas px-3 py-3 sm:px-4 dark:bg-[#1A1A1A]"
          >
            <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card text-primary">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <p className="text-xl font-bold tabular-nums text-primary dark:text-foreground">
              {item.value}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
              {item.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function StreakStatsGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-muted/50 px-3 py-3 dark:bg-[#1A1A1A]"
          >
            <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="text-base font-bold tabular-nums leading-none text-primary dark:text-foreground">
                {item.value}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {item.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const displayName = displayStudentName(user?.fullName);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const dashboard = await studentDashboardRequest();
        if (!cancelled) setData(dashboard);
      } catch {
        if (!cancelled) {
          setError("Could not load your dashboard. Try again.");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?._id]);

  const featured = data?.continueCourse ?? null;
  const stats = data?.stats;
  const courses = data?.learningCourses ?? [];
  const showContinueLearning = Boolean(featured?.id);

  const summaryStats: StatItem[] = [
    {
      label: "Active courses",
      value: stats?.activeCourses ?? 0,
      icon: BookOpen,
    },
    {
      label: "Completed",
      value: stats?.completedCourses ?? 0,
      icon: CheckCircle2,
    },
    {
      label: "Certificates",
      value: stats?.certificates ?? 0,
      icon: Award,
    },
  ];

  const streakStats: StatItem[] = [
    {
      label: "Day streak",
      value: stats?.streakDays ?? 0,
      icon: Flame,
    },
    {
      label: "Done",
      value: stats?.completedLessons ?? 0,
      icon: CheckCircle2,
    },
    {
      label: "Left",
      value: stats?.remainingLessons ?? 0,
      icon: Target,
    },
  ];

  return (
    <StudentShell>
      <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8">
        <header>
          <h1 className="font-display text-2xl font-bold tracking-tight text-primary dark:text-foreground sm:text-3xl">
            {greetingForHour()}
            {displayName ? (
              <span className="font-semibold text-muted-foreground">
                , {displayName}
              </span>
            ) : null}
          </h1>
        </header>

        {loading ? (
          <div className="flex min-h-[16rem] items-center justify-center">
            <Spinner className="sm" label="Loading dashboard" />
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <>
            <section className="overflow-hidden rounded-[1.75rem] border border-border bg-card">
              {showContinueLearning && featured ? (
                <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.9fr)] lg:items-stretch">
                  <div className="flex min-h-0 flex-col justify-between gap-6 border-border p-6 sm:p-8 lg:border-r">
                    <div className="space-y-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Continue learning
                      </p>
                      <div className="space-y-2">
                        <h2 className="font-display text-2xl font-bold leading-tight text-primary dark:text-foreground sm:text-[1.75rem]">
                          {featured.title}
                        </h2>
                        {featured.description?.trim() ? (
                          <p className="max-w-xl text-sm leading-relaxed text-secondary-foreground">
                            {featured.description.trim()}
                          </p>
                        ) : null}
                      </div>
                      <Button asChild className="rounded-2xl px-6">
                        <Link href={`/student/learn/${featured.id}`}>
                          Continue learning
                        </Link>
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <SummaryStatsGrid items={summaryStats} />
                      <p className="text-sm text-muted-foreground">
                        Continue your learning to achieve your target!
                      </p>
                      <StreakStatsGrid items={streakStats} />
                    </div>
                  </div>

                  <div className="relative min-h-[220px] border-t border-border bg-muted lg:min-h-[360px] lg:border-t-0">
                    {featured.thumbnailUrl ? (
                      <Image
                        src={mediaPublicUrl(featured.thumbnailUrl)!}
                        alt={featured.title}
                        fill
                        className="object-cover"
                        unoptimized
                        priority
                      />
                    ) : (
                      <div className="flex h-full min-h-[220px] items-center justify-center px-6 text-center text-sm font-semibold text-muted-foreground lg:min-h-[360px]">
                        {featured.title}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-6 sm:p-8">
                  <SummaryStatsGrid items={summaryStats} />
                  <p className="text-sm text-muted-foreground">
                    Continue your learning to achieve your target!
                  </p>
                  <StreakStatsGrid items={streakStats} />
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-primary dark:text-foreground">
                  Available courses
                </h2>
                <Link
                  href="/student/courses"
                  className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  My courses
                </Link>
              </div>

              {courses.length === 0 ? (
                <div className="rounded-[1.5rem] border border-border/70 bg-card px-6 py-12 text-center shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    No active courses yet. Enroll to start learning.
                  </p>
                  <Button asChild className="mt-4 rounded-2xl" size="sm">
                    <Link href="/courses">Browse courses</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {courses.map((course) => (
                    <EnrolledCourseCard
                      key={course.id}
                      courseId={course.courseId}
                      title={course.title}
                      thumbnailUrl={course.thumbnailUrl}
                      progressPercent={course.progressPercent}
                      watched={course.watched}
                      total={course.total}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </StudentShell>
  );
}
