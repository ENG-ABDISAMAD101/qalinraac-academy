"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Flame,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { StudentShell } from "@/components/student/StudentShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  mediaPublicUrl,
  studentDashboardRequest,
  type StudentDashboardData,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  cn,
  displayStudentName,
  greetingForHour,
  initialsFromName,
} from "@/lib/utils";

function ProgressAvatar({
  value,
  avatarUrl,
  name,
  streakDays,
}: {
  value: number;
  avatarUrl?: string;
  name: string;
  streakDays: number;
}) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(Math.max(value, 0), 100) / 100) * c;

  return (
    <div className="relative mx-auto h-40 w-40">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="10"
        />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="#6B7280"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-3 overflow-hidden rounded-full bg-primary-soft">
        <Avatar className="h-full w-full">
          <AvatarImage
            src={mediaPublicUrl(avatarUrl)}
            alt={name}
            className="object-cover"
          />
          <AvatarFallback className="text-lg font-bold text-primary">
            {initialsFromName(name)}
          </AvatarFallback>
        </Avatar>
      </div>
      <span
        className="absolute -bottom-1 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 text-primary"
        title={`${streakDays} day streak`}
        aria-label={`${streakDays} day streak`}
      >
        <Flame className="h-5 w-5 fill-primary text-primary" />
        <span className="text-xs font-bold">{streakDays}</span>
      </span>
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
  }, []);

  const continueHref = data?.continueCourse
    ? `/student/learn/${data.continueCourse.id}`
    : "/student/courses";

  const heroTitle =
    data?.continueCourse?.title ??
    "Sharpen Your Skills with Professional Online Courses";

  const stats = data?.stats;
  const statCards = [
    {
      label: "Active Courses",
      value: stats?.activeCourses ?? 0,
      tone: "navy" as const,
      icon: BookOpen,
    },
    {
      label: "Completed",
      value: stats?.completedCourses ?? 0,
      tone: "lime" as const,
      icon: CheckCircle2,
    },
    {
      label: "Certificates",
      value: stats?.certificates ?? 0,
      tone: "navy" as const,
      icon: Award,
    },
    {
      label: "Quiz Avg",
      value: stats?.quizAverage == null ? "—" : `${stats.quizAverage}%`,
      tone: "lime" as const,
      icon: ClipboardList,
    },
  ];

  return (
    <StudentShell>
      <div className="grid min-h-screen grid-cols-1 gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="rounded-[1.5rem] border border-border/70 bg-card px-8 py-10 shadow-sm dark:bg-card">
            <div className="max-w-xl">
              <p className="text-sm font-medium text-muted-foreground">
                {greetingForHour()}, {displayName}
              </p>
              <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-primary dark:text-foreground md:text-4xl">
                {heroTitle}
              </h1>
              <Button asChild className="mt-6">
                <Link href={continueHref}>Continue Learning</Link>
              </Button>
            </div>
          </section>

          {loading ? (
            <div className="flex min-h-[12rem] items-center justify-center">
              <Spinner className="sm" label="Loading dashboard" />
            </div>
          ) : error ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      className="card-soft flex items-center justify-between px-5 py-4"
                    >
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {card.label}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-primary dark:text-foreground">
                          {card.value}
                        </p>
                      </div>
                      <span
                        className={
                          card.tone === "lime"
                            ? "flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft text-primary"
                            : "flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-primary"
                        }
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                    </div>
                  );
                })}
              </div>

              {(data?.learningCourses?.length ?? 0) > 0 ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {data!.learningCourses.slice(0, 3).map((p) => (
                    <Link
                      key={p.id}
                      href={`/student/learn/${p.courseId}`}
                      className="card-soft flex items-center gap-4 px-4 py-3.5 transition hover:-translate-y-0.5"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-xs font-bold text-primary-foreground">
                        {p.progressPercent}%
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-primary dark:text-foreground">
                          {p.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.watched}/{p.total || "—"} watched
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}

              <section>
                <h2 className="mb-4 text-lg font-bold text-primary dark:text-foreground">
                  Continue Learning
                </h2>
                {(data?.learningCourses?.length ?? 0) === 0 ? (
                  <div className="card-soft px-5 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No active courses yet. Browse and enroll to start learning.
                    </p>
                    <Button asChild className="mt-4" size="sm">
                      <Link href="/student/courses">My Courses</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {data!.learningCourses.map((course) => (
                      <article
                        key={course.id}
                        className="card-soft overflow-hidden"
                      >
                        <div className="relative aspect-[16/10] bg-muted">
                          {course.thumbnailUrl ? (
                            <Image
                              src={course.thumbnailUrl}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-primary/5 text-sm font-semibold text-primary">
                              {course.title}
                            </div>
                          )}
                        </div>
                        <div className="space-y-3 p-5">
                          <h3 className="text-base font-bold leading-snug text-foreground">
                            {course.title}
                          </h3>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${course.progressPercent}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                              {course.progressPercent}% complete
                            </p>
                            <Button asChild size="sm">
                              <Link href={`/student/learn/${course.courseId}`}>
                                Continue
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section className="card-soft p-5">
                <h2 className="mb-4 text-base font-bold text-primary dark:text-foreground">
                  Upcoming Quizzes
                </h2>
                {(data?.upcomingQuizzes?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No upcoming quizzes. Start a course to see your next quizzes
                    here.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {data!.upcomingQuizzes.map((q) => (
                      <li key={q.id}>
                        <Link
                          href={`/student/learn/${q.courseId}`}
                          className={cn(
                            "block rounded-2xl border border-border px-4 py-3 transition hover:bg-accent/50",
                          )}
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {q.title}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {q.courseTitle}
                            {q.lessonTitle ? ` · ${q.lessonTitle}` : ""}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {(data?.notifications?.length ?? 0) > 0 ? (
                <section className="card-soft p-5">
                  <h2 className="mb-4 text-base font-bold text-primary dark:text-foreground">
                    Recent Notifications
                  </h2>
                  <ul className="space-y-3">
                    {data!.notifications.map((n) => (
                      <li
                        key={n.id}
                        className={cn(
                          "rounded-2xl border border-border px-4 py-3",
                          !n.read && "bg-primary-soft/40",
                        )}
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {n.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {n.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          )}
        </div>

        <aside className="hidden space-y-6 border-l border-border/60 bg-background/60 px-5 py-6 xl:block">
          <section className="card-soft p-5">
            <h2 className="mb-6 font-bold text-primary dark:text-foreground">
              Statistic
            </h2>
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner className="sm" label="Loading stats" />
              </div>
            ) : (
              <>
                <ProgressAvatar
                  value={stats?.overallProgress ?? 0}
                  avatarUrl={user?.avatarUrl}
                  name={user?.fullName ?? "Student"}
                  streakDays={stats?.streakDays ?? 0}
                />
                <p className="mt-8 text-center text-xs text-muted-foreground">
                  Continue your learning to achieve your target!
                </p>

                <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-muted px-2 py-3">
                    <p className="text-lg font-bold text-primary dark:text-foreground">
                      {stats?.streakDays ?? 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Day streak
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted px-2 py-3">
                    <p className="text-lg font-bold text-primary dark:text-foreground">
                      {stats?.completedLessons ?? 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Done</p>
                  </div>
                  <div className="rounded-2xl bg-muted px-2 py-3">
                    <p className="text-lg font-bold text-primary dark:text-foreground">
                      {stats?.remainingLessons ?? 0}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Left</p>
                  </div>
                </div>

                <div className="mt-6 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.activity ?? []}>
                      <XAxis
                        dataKey="range"
                        tick={{ fontSize: 10, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: "rgba(28,30,33,0.04)" }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "none",
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="hours"
                        fill="#111827"
                        radius={[8, 8, 8, 8]}
                        barSize={28}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </section>
        </aside>
      </div>
    </StudentShell>
  );
}
