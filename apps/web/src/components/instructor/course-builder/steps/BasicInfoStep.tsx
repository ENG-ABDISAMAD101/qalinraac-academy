"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COURSE_CATEGORIES, type CourseCategory } from "@/lib/api";
import { UploadCard } from "../UploadCard";
import { LANGUAGES, LEVELS, type StepProps } from "../types";

export function BasicInfoStep({ draft, setDraft, readOnly }: StepProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="card-soft space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold text-primary dark:text-foreground">
            Basic Information
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Core details students see first on your course card.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="course-title">Course Title</Label>
          <Input
            id="course-title"
            value={draft.title}
            maxLength={160}
            disabled={readOnly}
            placeholder="e.g. Full Stack Mobile Development"
            onChange={(e) => setDraft({ title: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={draft.category || undefined}
              disabled={readOnly}
              onValueChange={(value) =>
                setDraft({ category: value as CourseCategory })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {COURSE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Level</Label>
            <Select
              value={draft.level || undefined}
              disabled={readOnly}
              onValueChange={(value) => setDraft({ level: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={draft.language || undefined}
              disabled={readOnly}
              onValueChange={(value) => setDraft({ language: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="card-soft h-fit space-y-3 p-5">
        <UploadCard
          kind="image"
          label="Course Thumbnail"
          hint="Recommended 16:9 · optional for later"
          value={draft.thumbnailUrl || undefined}
          readOnly={readOnly}
          onChange={(url) => setDraft({ thumbnailUrl: url ?? "" })}
        />
      </div>
    </div>
  );
}
