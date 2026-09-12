"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const CART_KEY = "qa_course_cart_v1";

export type CartCourse = {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl?: string;
  instructorName: string;
  priceCents: number;
  currency: string;
  accessLabel: string;
  level: string;
  description?: string;
};

type CartContextValue = {
  items: CartCourse[];
  itemCount: number;
  subtotalCents: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (course: CartCourse, openDrawer?: boolean) => void;
  removeItem: (courseId: string) => void;
  clearCart: () => void;
  hasItem: (courseId: string) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartCourse[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartCourse[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartCourse[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((course: CartCourse, openDrawer = true) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === course.id)) return prev;
      return [...prev, course];
    });
    if (openDrawer) setOpen(true);
  }, []);

  const removeItem = useCallback((courseId: string) => {
    setItems((prev) => prev.filter((p) => p.id !== courseId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const hasItem = useCallback(
    (courseId: string) => items.some((p) => p.id === courseId),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.length,
      subtotalCents: items.reduce((sum, i) => sum + i.priceCents, 0),
      open,
      setOpen,
      addItem,
      removeItem,
      clearCart,
      hasItem,
    }),
    [items, open, addItem, removeItem, clearCart, hasItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function formatMoney(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}
