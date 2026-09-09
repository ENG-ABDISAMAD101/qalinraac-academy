import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ScrollTableProps = {
  children: ReactNode;
  className?: string;
  /** Optional bar above the scroll area (title, filters, count) */
  toolbar?: ReactNode;
  /** Viewport-relative max height for vertical scroll */
  maxHeightClassName?: string;
  minWidthClassName?: string;
};

/**
 * Card table with horizontal + vertical scroll and a sticky header.
 */
export function ScrollTable({
  children,
  className,
  toolbar,
  maxHeightClassName = "max-h-[min(68vh,38rem)]",
  minWidthClassName = "min-w-[56rem]",
}: ScrollTableProps) {
  return (
    <div className={cn("card-soft flex flex-col overflow-hidden", className)}>
      {toolbar ? (
        <div className="shrink-0 border-b border-border px-5 py-3.5">
          {toolbar}
        </div>
      ) : null}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-auto overscroll-contain scroll-smooth",
          "scrollbar-thin",
          maxHeightClassName,
        )}
      >
        <table className={cn("w-full text-left text-sm", minWidthClassName)}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function ScrollTableHead({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <thead
      className={cn(
        "sticky top-0 z-10 border-b border-border bg-muted/95 text-xs uppercase tracking-wide text-muted-foreground backdrop-blur-sm",
        "shadow-[0_1px_0_0_rgba(28,30,33,0.08)]",
        className,
      )}
    >
      {children}
    </thead>
  );
}

export function StickyActionCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "sticky right-0 bg-card px-5 py-4",
        "shadow-[-8px_0_12px_-8px_rgba(28,30,33,0.12)]",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function StickyActionHead({
  children = "Action",
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "sticky right-0 bg-muted/95 px-5 py-3 font-medium backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function ScrollTableEmpty({
  colSpan,
  message = "No rows to show",
}: {
  colSpan: number;
  message?: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-12 text-center text-sm text-muted-foreground"
      >
        {message}
      </td>
    </tr>
  );
}
