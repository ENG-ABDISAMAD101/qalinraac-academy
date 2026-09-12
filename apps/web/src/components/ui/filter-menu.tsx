"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type FilterOption = { value: string; label: string };

/**
 * Select-looking filter that uses DropdownMenu (non-modal) so it does not
 * lock body scroll / shift sticky headers. Prefer this for page toolbars.
 */
export function FilterMenu({
  value,
  onValueChange,
  options,
  "aria-label": ariaLabel,
  className,
  contentClassName,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
  "aria-label": string;
  className?: string;
  contentClassName?: string;
}) {
  const selected = options.find((o) => o.value === value)?.label ?? value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm shadow-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          <span className="truncate text-left">{selected}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn("min-w-[11rem]", contentClassName)}
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onValueChange(option.value)}
            className="justify-between"
          >
            <span>{option.label}</span>
            {option.value === value ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <span className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
