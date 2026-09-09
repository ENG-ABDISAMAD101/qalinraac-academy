"use client";

import { CircleHelp } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/** Shared native select styles matching Input */
export const formSelectClassName =
  "flex h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-primary/20 dark:focus-visible:border-primary";

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-semibold text-foreground"
        >
          {label}
        </label>
      ) : null}
      {children}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function FormCard({
  title,
  description,
  className,
  children,
}: {
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-background p-6 shadow-[0_16px_40px_-28px_rgba(28,30,33,0.35)] sm:p-7",
        className,
      )}
    >
      {title ? (
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-primary dark:text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export type FormActionsProps = {
  helpHref?: string;
  helpLabel?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel?: () => void;
  confirmType?: "button" | "submit";
  confirmDisabled?: boolean;
  confirmLoading?: boolean;
  onConfirm?: () => void;
  className?: string;
  children?: React.ReactNode;
  showHelp?: boolean;
};

/** Footer: Help Center (left) · Cancel + primary (right) — same as modal design */
export function FormActions({
  helpHref = "#",
  helpLabel = "Help Center",
  cancelLabel = "Cancel",
  confirmLabel = "Save",
  onCancel,
  confirmType = "submit",
  confirmDisabled,
  confirmLoading,
  onConfirm,
  className,
  children,
  showHelp = true,
}: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {showHelp ? (
        <a
          href={helpHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <CircleHelp className="h-4 w-4" />
          {helpLabel}
        </a>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {children}
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
        ) : null}
        <Button
          type={confirmType}
          disabled={confirmDisabled || confirmLoading}
          onClick={confirmType === "button" ? onConfirm : undefined}
        >
          {confirmLoading ? (
            <Spinner className="sm on-primary" label={confirmLabel} />
          ) : null}
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
