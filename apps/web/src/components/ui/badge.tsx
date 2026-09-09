import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        lime: "bg-primary-soft text-primary",
        muted: "bg-muted text-muted-foreground",
        warning:
          "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
        danger: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
        outline: "border border-border bg-transparent text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "muted",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

/** Maps a raw course status to a Badge variant. */
export function courseStatusBadgeVariant(
  status: string,
): NonNullable<BadgeProps["variant"]> {
  switch (status) {
    case "published":
      return "lime";
    case "pending_review":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "muted";
  }
}

export { Badge, badgeVariants };
