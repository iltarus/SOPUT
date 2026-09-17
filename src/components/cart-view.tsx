"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { ProductCard } from "@/components/product-card";
import { ReasonList } from "@/components/reason-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { asProduct, type SerializedProduct } from "@/lib/serialize";
import { cn } from "@/lib/utils";
import type { Product, Recommendation } from "@/lib/types";

type ApiItem = SerializedProduct & {
  score: number;
  group: Recommendation["group"];
  reasons: Recommendation["reasons"];
};

type Hydrated = ApiItem & { product: Product };

export function CartView() {
  const { items, setQty, remove, clear, total } = useCart();
  const idsKey = items.map((item) => item.product.id).join(",");
  const [payload, setPayload] = useState<{ key: string; recs: Hydrated[]; error: string | null }>({
    key: "",
    recs: [],
    error: null,
  });

  useEffect(() => {
    if (!idsKey) return;
    const controller = new AbortController();
    fetch("/api/cart/related", {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({ ids: idsKey.split(","), limit: 8 }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Не удалось получить рекомендации корзины");
        const data = (await response.json()) as { items: ApiItem[] };
        setPayload({
          key: idsKey,
          error: null,
          recs: data.items.map((item) => ({
            ...item,
            product: asProduct(item),
          })),
        });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setPayload({
          key: idsKey,
          recs: [],
          error: err instanceof Error ? err.message : "Ошибка рекомендаций",
        });
      });
    return () => controller.abort();
  }, [idsKey]);

  const loading = items.length > 0 && payload.key !== idsKey;
  const visibleRecs = payload.key === idsKey ? payload.recs : [];
  const error = payload.key === idsKey ? payload.error : null;

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-10 text-center">
        <p className="text-lg font-semibold">Корзина пустая</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Добавьте принтер, степлер или кофемашину — сервис соберёт расходники ко всему набору.
        </p>
        <Link href="/" className={cn(buttonVariants(), "mt-4")}>
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.product.id} className="flex gap-4 rounded-xl border bg-card p-4">
            <div className="min-w-0 flex-1">
              <Link href={`/p/${item.product.id}`} className="font-medium hover:text-primary">
                {item.product.name}
              </Link>
              <p className="font-mono text-xs text-muted-foreground">арт. {item.product.sku}</p>
              <p className="mt-2 text-sm font-semibold">{formatPrice(item.product.price * item.qty)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon-sm" variant="outline" onClick={() => setQty(item.product.id, item.qty - 1)}>
                −
              </Button>
              <span className="w-6 text-center text-sm">{item.qty}</span>
              <Button size="icon-sm" variant="outline" onClick={() => setQty(item.product.id, item.qty + 1)}>
                +
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(item.product.id)}>
                Убрать
              </Button>
            </div>
          </div>
        ))}
      </div>
      <aside className="h-fit space-y-4 rounded-xl border bg-card p-4">
        <p className="text-sm text-muted-foreground">Итого без скидок Комус</p>
        <p className="text-2xl font-semibold">{formatPrice(total)}</p>
        <Button className="w-full" disabled>
          Оформление — только демо
        </Button>
        <Button variant="ghost" className="w-full" onClick={clear}>
          Очистить корзину
        </Button>
      </aside>
      <section className="lg:col-span-2 space-y-3">
        <h2 className="text-lg font-semibold">Не забудьте расходники</h2>
        {loading ? <p className="text-sm text-muted-foreground">Подбираем комплект к корзине…</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!loading && visibleRecs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Для этого набора дополнительных позиций нет.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {visibleRecs.map((item) =>
              item.product ? (
                <div key={item.id} className="space-y-2">
                  <ProductCard product={item.product} href={`/p/${item.id}`} compact />
                  <ReasonList reasons={item.reasons} limit={2} />
                </div>
              ) : null,
            )}
          </div>
        )}
      </section>
    </div>
  );
}
