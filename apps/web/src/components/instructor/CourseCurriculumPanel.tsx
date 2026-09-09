"use client";

import { useMemo, useState } from "react";
import { PlayCircle, Plus, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { InstructorLesson, InstructorModule } from "@/lib/api";
import { mediaPublicUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatHoursMinutes(totalMinutes: number) {
  const mins = Math.max(0, Math.round(totalMinutes));
  if (mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatLessonDuration(mins?: number) {
  if (!mins || mins <= 0) return null;
  if (mins < 60) return `${Math.round(mins)}m`;
  return formatHoursMinutes(mins);
}

function sectionNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

function moduleMinutes(mod: InstructorModule) {
  return mod.lessons.reduce((sum, l) => sum + (l.durationMinutes ?? 0), 0);
}

function modulePreviewCount(mod: InstructorModule) {
  return mod.lessons.filter((l) => l.isPreview).length;
}

type CourseCurriculumPanelProps = {
  curriculum: InstructorModule[];
  className?: string;
};

export function CourseCurriculumPanel({
  curriculum,
  className,
}: CourseCurriculumPanelProps) {
  const [open, setOpen] = useState<string[]>([]);
  const [watching, setWatching] = useState<InstructorLesson | null>(null);

  const stats = useMemo(() => {
    const sections = curriculum.length;
    const lessons = curriculum.reduce((sum, m) => sum + m.lessons.length, 0);
    const totalMinutes = curriculum.reduce(
      (sum, m) => sum + moduleMinutes(m),
      0,
    );
    return { sections, lessons, totalMinutes };
  }, [curriculum]);

  const allIds = useMemo(() => curriculum.map((m) => m.id), [curriculum]);
  const allExpanded = allIds.length > 0 && open.length === allIds.length;
  const watchUrl = mediaPublicUrl(watching?.videoUrl);

  if (curriculum.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <h2 className="text-sm font-bold text-brand-navy dark:text-foreground">
          Curriculum
        </h2>
        <p className="text-sm text-muted-foreground">No modules yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-brand-navy dark:text-foreground">
            Curriculum
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.sections} {stats.sections === 1 ? "section" : "sections"}
            <span className="mx-1.5 text-border">·</span>
            {stats.lessons} {stats.lessons === 1 ? "lesson" : "lessons"}
            <span className="mx-1.5 text-border">·</span>
            {formatHoursMinutes(stats.totalMinutes)} total
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs font-semibold text-brand-navy dark:text-brand-lime"
          onClick={() => setOpen(allExpanded ? [] : allIds)}
        >
          {allExpanded ? "Collapse all" : "Expand all"}
        </Button>
      </div>

      <Accordion
        type="multiple"
        value={open}
        onValueChange={setOpen}
        className="space-y-2"
      >
        {curriculum.map((mod, index) => {
          const mins = moduleMinutes(mod);
          const previews = modulePreviewCount(mod);
          return (
            <AccordionItem
              key={mod.id}
              value={mod.id}
              className="rounded-xl border border-border/80 bg-background"
            >
              <AccordionTrigger
                hideChevron
                className="gap-3 px-4 py-3 hover:bg-muted/40"
              >
                <span className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 w-8 shrink-0 text-sm font-bold tabular-nums text-muted-foreground">
                    {sectionNumber(index)}
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-sm font-bold leading-snug text-foreground">
                      {mod.title}
                    </span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      {mod.lessons.length}{" "}
                      {mod.lessons.length === 1 ? "lesson" : "lessons"}
                      <span className="mx-1.5">·</span>
                      {formatHoursMinutes(mins)}
                      {previews > 0 ? (
                        <>
                          <span className="mx-1.5">·</span>
                          {previews} free{" "}
                          {previews === 1 ? "preview" : "previews"}
                        </>
                      ) : null}
                    </span>
                  </span>
                </span>
                <span
                  className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/80 text-brand-navy dark:text-brand-lime"
                  aria-hidden
                >
                  <Plus className="h-4 w-4 transition-opacity group-data-[state=open]:opacity-0" />
                  <X className="absolute h-4 w-4 opacity-0 transition-opacity group-data-[state=open]:opacity-100" />
                </span>
              </AccordionTrigger>

              <AccordionContent className="border-t border-border/60 px-0 pb-0 pt-0">
                {mod.lessons.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">
                    No lessons in this section yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {mod.lessons.map((lesson, lessonIndex) => {
                      const duration = formatLessonDuration(
                        lesson.durationMinutes,
                      );
                      const hasVideo = Boolean(lesson.videoUrl);
                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            disabled={!hasVideo}
                            onClick={() => {
                              if (hasVideo) setWatching(lesson);
                            }}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                              hasVideo
                                ? "hover:bg-muted/50"
                                : "cursor-default opacity-80",
                            )}
                          >
                            <PlayCircle
                              className={cn(
                                "h-4 w-4 shrink-0",
                                hasVideo
                                  ? "text-brand-navy dark:text-brand-lime"
                                  : "text-muted-foreground",
                              )}
                            />
                            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                              <span className="mr-2 text-xs font-semibold text-muted-foreground">
                                {lessonIndex + 1}.
                              </span>
                              {lesson.title}
                            </span>
                            {lesson.isPreview ? (
                              <span className="shrink-0 rounded-full bg-brand-lime-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-navy">
                                Preview
                              </span>
                            ) : null}
                            {hasVideo ? (
                              <span className="shrink-0 text-xs font-semibold text-brand-navy dark:text-brand-lime">
                                Watch
                              </span>
                            ) : null}
                            {duration ? (
                              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                {duration}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <Dialog
        open={Boolean(watching)}
        onOpenChange={(next) => {
          if (!next) setWatching(null);
        }}
      >
        <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0 sm:rounded-2xl">
          <DialogHeader className="space-y-1 px-5 pb-3 pt-5">
            <DialogTitle className="pr-8 text-base">
              {watching?.title ?? "Lesson video"}
            </DialogTitle>
            <DialogDescription>
              Instructor preview of the uploaded lesson video.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-black">
            {watchUrl ? (
              <video
                key={watchUrl}
                src={watchUrl}
                controls
                autoPlay
                playsInline
                className="aspect-video w-full"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center px-4 text-sm text-white/70">
                Video URL is missing or unavailable.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
