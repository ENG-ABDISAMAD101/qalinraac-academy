"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCESS_DURATIONS, type AccessDuration, type StepProps } from "../types";
import { cn } from "@/lib/utils";

export function PricingStep({ draft, setDraft, readOnly }: StepProps) {
  const priceDollars =
    draft.priceCents > 0 ? String(draft.priceCents / 100) : "";

  return (
    <div className="card-soft mx-auto max-w-xl space-y-6 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-primary dark:text-foreground">
          Pricing
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the course price and how long students keep access.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="course-price">Course Price (USD)</Label>
        <Input
          id="course-price"
          type="number"
          min={0}
          step="0.01"
          disabled={readOnly}
          placeholder="Enter price"
          value={priceDollars}
          onChange={(e) => {
            const raw = e.target.value.trim();
            if (raw === "") {
              setDraft({ priceCents: 0, isFree: true });
              return;
            }
            const dollars = Number(raw);
            const priceCents = Number.isFinite(dollars)
              ? Math.max(0, Math.round(dollars * 100))
              : 0;
            setDraft({
              priceCents,
              isFree: priceCents === 0,
            });
          }}
        />
      </div>

      <div className="space-y-3">
        <Label>Access Duration</Label>
        <div className="space-y-2">
          {ACCESS_DURATIONS.map((opt) => {
            const active = draft.accessDuration === opt.value;
            return (
              <label
                key={opt.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                  active
                    ? "border-primary bg-primary/5 dark:border-primary dark:bg-primary/10"
                    : "border-border/70 hover:bg-accent/40",
                  readOnly && "pointer-events-none opacity-70",
                )}
              >
                <input
                  type="radio"
                  name="accessDuration"
                  className="h-4 w-4 accent-primary"
                  checked={active}
                  disabled={readOnly}
                  onChange={() =>
                    setDraft({ accessDuration: opt.value as AccessDuration })
                  }
                />
                <span className="font-medium">{opt.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
