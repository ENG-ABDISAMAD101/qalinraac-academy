"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationBellTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  count?: number;
};

/** Bell trigger with top count badge + pulse (Uiverse asgardOP adapted). */
export const NotificationBellTrigger = forwardRef<
  HTMLButtonElement,
  NotificationBellTriggerProps
>(function NotificationBellTrigger(
  { count = 0, className, "aria-label": ariaLabel, ...props },
  ref,
) {
  const label = count > 99 ? "99+" : String(count);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={
        ariaLabel ??
        (count > 0 ? `Notifications, ${label}` : "Notifications")
      }
      className={cn("notif-bell", className)}
      {...props}
    >
      <Bell className="notif-bell-icon h-4 w-4" aria-hidden />
      {count > 0 ? (
        <span className="notif-bell-point" aria-hidden>
          <span className="notif-bell-count">{label}</span>
        </span>
      ) : null}
    </button>
  );
});
