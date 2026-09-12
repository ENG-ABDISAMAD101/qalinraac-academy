"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative rounded-full border-border bg-background shadow-sm",
        className,
      )}
    >
      <Sun
        className={cn(
          "h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90",
          iconClassName,
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0",
          iconClassName,
        )}
      />
    </Button>
  );
}
