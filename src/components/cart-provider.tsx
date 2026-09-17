"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import type { Product } from "@/lib/types";

type CartItem = { product: Product; qty: number };

type CartContextValue = {
  items: CartItem[];
  add: (product: Product) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "soput-cart";

let memory: CartItem[] | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function getSnapshot(): CartItem[] {
  if (memory === null) memory = readStorage();
  return memory;
}

function getServerSnapshot(): CartItem[] {
  return [];
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: CartItem[]) {
  memory = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  emit();
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((product: Product) => {
    const current = getSnapshot();
    const found = current.find((item) => item.product.id === product.id);
    if (found) {
      commit(
        current.map((item) => (item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item)),
      );
      return;
    }
    commit([...current, { product, qty: 1 }]);
  }, []);

  const remove = useCallback((id: string) => {
    commit(getSnapshot().filter((item) => item.product.id !== id));
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      commit(getSnapshot().filter((item) => item.product.id !== id));
      return;
    }
    commit(getSnapshot().map((item) => (item.product.id === id ? { ...item, qty } : item)));
  }, []);

  const clear = useCallback(() => commit([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.qty, 0);
    const total = items.reduce((sum, item) => sum + item.qty * item.product.price, 0);
    return { items, add, remove, setQty, clear, count, total };
  }, [items, add, remove, setQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart вне CartProvider");
  return ctx;
}
