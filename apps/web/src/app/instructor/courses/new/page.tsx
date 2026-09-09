"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  DollarSign,
  LayoutList,
  Sparkles,
} from "lucide-react";
import { InstructorShell } from "@/components/instructor/InstructorShell";
import { BUILDER_STEPS } from "@/components/instructor/course-builder/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getApiErrorMessage, instructorCreateCourseRequest } from "@/lib/api";

const HIGHLIGHTS = [
  {
    icon: LayoutList,
    title: "Structure first",
    body: "Build modules and lessons with drag-and-drop, then fill in the content.",
  },
  {
    icon: ClipboardList,
    title: "Assess as you go",
    body: "Attach quizzes and assignments to any lesson without leaving the builder.",
  },
  {
    icon: DollarSign,
    title: "Price when ready",
    body: "Set free or paid pricing, visibility, banner, and promo video at the end.",
  },
];

export default function CreateCoursePage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function createCourse() {
    setCreating(true);
    setError("");
    try {
      const course = await instructorCreateCourseRequest({
        title: "Untitled Course",
      });
      router.replace(`/instructor/courses/${course.id}/builder`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create the course."));
      setCreating(false);
    }
  }

  return (
    <InstructorShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/instructor/courses">
            <ArrowLeft className="h-4 w-4" />
            Back to My Courses
          </Link>
        </Button>

        <div className="card-soft space-y-6 p-6 sm:p-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-lime-soft px-3 py-1 text-xs font-bold text-brand-navy">
              <Sparkles className="h-3.5 w-3.5" />
              7-step course builder
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold text-brand-navy dark:text-foreground">
              Create a new course
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;ll create a draft called{" "}
              <span className="font-medium text-foreground">
                “Untitled Course”
              </span>{" "}
              and open the builder. Everything you type is saved automatically —
              nothing goes live until the Academic team approves it.
            </p>
          </div>

          <ol className="grid gap-2 sm:grid-cols-2">
            {BUILDER_STEPS.map((s) => (
              <li
                key={s.step}
                className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-2.5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-navy/5 text-[11px] font-bold text-brand-navy dark:bg-brand-lime/10 dark:text-brand-lime">
                  {s.step}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {s.label}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {s.hint}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          {error ? (
            <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="lg"
              disabled={creating}
              onClick={() => void createCourse()}
            >
              {creating ? (
                <Spinner className="sm on-primary" label="Creating course" />
              ) : null}
              Start building
              {!creating ? <ArrowRight className="h-4 w-4" /> : null}
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/instructor/courses">Cancel</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="card-soft space-y-2 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy/5 text-brand-navy dark:bg-brand-lime/10 dark:text-brand-lime">
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-sm font-bold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </InstructorShell>
  );
}
