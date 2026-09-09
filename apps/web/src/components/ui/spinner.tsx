import { cn } from "@/lib/utils";

const BLADES = 12;

type SpinnerProps = {
  className?: string;
  /** Absolutely center in the nearest positioned parent */
  center?: boolean;
  /** Accessible label (screen readers only — never shown visually) */
  label?: string;
};

export function Spinner({
  className,
  center = false,
  label = "Loading",
}: SpinnerProps) {
  return (
    <div
      className={cn("spinner", center && "center", className)}
      role="status"
      aria-label={label}
    >
      {Array.from({ length: BLADES }, (_, i) => (
        <div key={i} className="spinner-blade" />
      ))}
      <span className="spinner-label">{label}</span>
    </div>
  );
}

type PageLoaderProps = {
  label?: string;
  className?: string;
};

/** Full-area centered blade spinner for shells, Suspense, and route waits. */
export function PageLoader({
  label = "Loading",
  className,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full items-center justify-center bg-canvas",
        className,
      )}
    >
      <Spinner center label={label} />
    </div>
  );
}
