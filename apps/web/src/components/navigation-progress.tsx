"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const MAX_PENDING = 94;

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firstLoadRef = useRef(true);
  const activeRef = useRef(false);
  const widthRef = useRef(0);

  function clearTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function stopTrickle() {
    if (trickleRef.current) {
      clearInterval(trickleRef.current);
      trickleRef.current = null;
    }
  }

  function setProgress(next: number) {
    widthRef.current = next;
    setWidth(next);
  }

  function startTrickle() {
    stopTrickle();
    trickleRef.current = setInterval(() => {
      const current = widthRef.current;
      if (current >= MAX_PENDING) return;
      // Keep moving toward ~94% while the page is still compiling/rendering.
      const remaining = MAX_PENDING - current;
      const step = Math.max(0.35, remaining * 0.045);
      setProgress(Math.min(MAX_PENDING, current + step));
    }, 450);
  }

  function start() {
    if (activeRef.current) return;
    activeRef.current = true;
    clearTimers();
    stopTrickle();
    setVisible(true);
    setProgress(0);
    requestAnimationFrame(() => {
      setProgress(12);
      timersRef.current.push(setTimeout(() => setProgress(28), 100));
      timersRef.current.push(setTimeout(() => setProgress(42), 280));
      startTrickle();
    });
  }

  function complete() {
    if (!activeRef.current) {
      setProgress(0);
      return;
    }
    clearTimers();
    stopTrickle();
    setProgress(100);
    timersRef.current.push(
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
        activeRef.current = false;
      }, 280),
    );
  }

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }
        start();
      } catch {
        /* ignore invalid href */
      }
    };

    const onPopState = () => start();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
      stopTrickle();
    };
  }, []);

  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      return;
    }
    // Programmatic navigations (router.push) may skip the click interceptor.
    if (!activeRef.current) {
      activeRef.current = true;
      setVisible(true);
      setProgress(64);
      startTrickle();
      // Still wait a beat so slow compiles can keep trickling if needed —
      // but pathname already changed, so complete shortly.
      timersRef.current.push(setTimeout(() => complete(), 120));
      return;
    }
    complete();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to route key
  }, [routeKey]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2.5px] overflow-hidden"
      aria-hidden
      data-navigation-progress={visible ? "active" : "idle"}
    >
      <div
        className="navigation-progress-bar relative h-full origin-left bg-primary will-change-[width,opacity]"
        style={{
          width: `${width}%`,
          opacity: visible ? 1 : 0,
          boxShadow: visible
            ? "0 0 8px color-mix(in oklab, var(--primary) 55%, transparent)"
            : "none",
          transition:
            width === 0 || width === 100
              ? "width 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease"
              : "width 450ms linear, opacity 180ms ease",
        }}
      >
        {visible && width > 0 && width < 100 ? (
          <span className="navigation-progress-pulse absolute inset-y-0 right-0 w-24" />
        ) : null}
      </div>
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
