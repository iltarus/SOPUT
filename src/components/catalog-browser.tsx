"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEPARTMENTS } from "@/lib/departments";
import { asProduct, type SerializedProduct } from "@/lib/serialize";
import { cn } from "@/lib/utils";
import type { DepartmentId, Product } from "@/lib/types";

const PAGE_SIZE = 48;

export function CatalogBrowser({
  initialItems,
  initialTotal,
  initialDepartment = "all",
}: {
  initialItems: Product[];
  initialTotal: number;
  initialDepartment?: DepartmentId | "all";
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [department, setDepartment] = useState<DepartmentId | "all">(initialDepartment);
  const [items, setItems] = useState<Product[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const isInitial = debounced === "" && department === initialDepartment;
    if (isInitial) {
      setItems(initialItems);
      setTotal(initialTotal);
      setError(null);
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    const controller = new AbortController();
    setLoading(true);
    fetchProducts({ q: debounced, department, offset: 0, signal: controller.signal })
      .then((payload) => {
        if (id !== requestId.current) return;
        setItems(payload.items);
        setTotal(payload.total);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (id !== requestId.current) return;
        setError(err instanceof Error ? err.message : "Не удалось загрузить каталог");
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });

    return () => controller.abort();
  }, [debounced, department, initialDepartment, initialItems, initialTotal]);

  const loadMore = () => {
    const id = ++requestId.current;
    const controller = new AbortController();
    setLoading(true);
    fetchProducts({ q: debounced, department, offset: items.length, signal: controller.signal })
      .then((payload) => {
        if (id !== requestId.current) return;
        setItems((current) => {
          const seen = new Set(current.map((product) => product.id));
          return [...current, ...payload.items.filter((product) => !seen.has(product.id))];
        });
        setTotal(payload.total);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (id !== requestId.current) return;
        setError(err instanceof Error ? err.message : "Не удалось загрузить каталог");
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию, бренду или артикулу Комус"
            className="bg-card pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString("ru-RU")} товаров
          {loading ? " · загрузка…" : null}
        </p>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <FilterChip active={department === "all"} onClick={() => setDepartment("all")}>
          Все отделы
        </FilterChip>
        {DEPARTMENTS.map((item) => (
          <FilterChip
            key={item.id}
            active={department === item.id}
            onClick={() => setDepartment(item.id)}
          >
            {item.title}
          </FilterChip>
        ))}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {items.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <p className="font-medium">Ничего не нашлось</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Попробуйте артикул Комус, бренд или категорию — например «степлер» или «Epson».
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} href={`/p/${product.id}`} />
          ))}
        </div>
      )}
      {items.length < total ? (
        <div className="flex justify-center">
          <Button type="button" variant="outline" disabled={loading} onClick={loadMore}>
            Показать ещё
          </Button>
        </div>
      ) : null}
      <p className="text-center text-xs text-muted-foreground">
        Каталог собран из sitemap komus.ru. Нужно править выдачу? Откройте{" "}
        <Link href="/workbench" className="underline">
          верстак мерчандайзера
        </Link>
        .
      </p>
    </div>
  );
}

async function fetchProducts({
  q,
  department,
  offset,
  signal,
}: {
  q: string;
  department: DepartmentId | "all";
  offset: number;
  signal: AbortSignal;
}) {
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(PAGE_SIZE),
  });
  if (q) params.set("q", q);
  if (department !== "all") params.set("department", department);
  const response = await fetch(`/api/products?${params}`, { signal });
  if (!response.ok) throw new Error("Не удалось загрузить каталог");
  const data = (await response.json()) as { total: number; items: SerializedProduct[] };
  return { total: data.total, items: data.items.map(asProduct) };
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
