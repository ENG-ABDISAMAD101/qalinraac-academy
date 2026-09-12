"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Play } from "lucide-react";
import { mediaPublicUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

export type EnrolledCourseCardProps = {
  courseId: string;
  title: string;
  thumbnailUrl?: string;
  progressPercent: number;
  watched?: number;
  total?: number;
  className?: string;
};

export function EnrolledCourseCard({
  courseId,
  title,
  thumbnailUrl,
  progressPercent,
  watched = 0,
  total = 0,
  className,
}: EnrolledCourseCardProps) {
  const progress = Math.min(Math.max(progressPercent ?? 0, 0), 100);
  const href = `/student/learn/${courseId}`;
  const thumb = mediaPublicUrl(thumbnailUrl);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card",
        className,
      )}
    >
      <Link href={href} className="relative block aspect-[16/10] bg-muted">
        {thumb ? (
          <Image
            src={thumb}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-muted-foreground">
            {title}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-semibold tabular-nums text-foreground">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-canvas dark:bg-[#1A1A1A]">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <h3 className="line-clamp-2 text-base font-bold leading-snug text-primary dark:text-foreground">
          <Link href={href} className="hover:underline">
            {title}
          </Link>
        </h3>

        <div className="mt-auto flex items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate tabular-nums">
              {watched}/{total} lessons
            </span>
          </p>
          <Link
            href={href}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-primary transition hover:bg-canvas dark:hover:bg-[#1A1A1A]"
            aria-label={`Play ${title}`}
          >
            <Play className="h-3.5 w-3.5 fill-primary" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
