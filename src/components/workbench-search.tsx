"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { asProduct, type SerializedProduct } from "@/lib/serialize";
import type { Product } from "@/lib/types";

export function WorkbenchSearch() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debounced.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/products?q=${encodeURIComponent(debounced)}&limit=12`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as { items: SerializedProduct[] };
        setItems(data.items.map(asProduct));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setItems([]);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [debounced]);

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm font-medium">Найти любой артикул Комус</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Полный каталог из sitemap. Откройте карточку в верстаке, чтобы закрепить расходники.
      </p>
      <div className="relative mt-3">
        <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Название, бренд или артикул"
          className="pl-9"
        />
      </div>
      <div className="mt-3 space-y-1">
        {loading ? <p className="text-xs text-muted-foreground">Ищем…</p> : null}
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/workbench/${item.id}`}
            className="block rounded-lg border px-3 py-2 hover:border-primary/40"
          >
            <span className="block truncate text-sm font-medium">{item.name}</span>
            <span className="font-mono text-[11px] text-muted-foreground">арт. {item.sku}</span>
          </Link>
        ))}
        {debounced.length >= 2 && !loading && items.length === 0 ? (
          <p className="text-xs text-muted-foreground">Нет совпадений в каталоге Комус.</p>
        ) : null}
      </div>
    </div>
  );
}
