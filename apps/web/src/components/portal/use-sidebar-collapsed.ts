"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useSidebarCollapsed(storageKey: string) {
  const eventName = `${storageKey}-change`;

  const subscribe = useCallback(
    (onChange: () => void) => {
      function handle() {
        onChange();
      }
      window.addEventListener(eventName, handle);
      window.addEventListener("storage", handle);
      return () => {
        window.removeEventListener(eventName, handle);
        window.removeEventListener("storage", handle);
      };
    },
    [eventName],
  );

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  }, [storageKey]);

  const collapsed = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const setCollapsed = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event(eventName));
    },
    [eventName, storageKey],
  );

  return [collapsed, setCollapsed] as const;
}
