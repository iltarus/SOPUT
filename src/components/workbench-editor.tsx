"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pin, PinOff, Search, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { ReasonList } from "@/components/reason-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { asProduct, type SerializedProduct } from "@/lib/serialize";
import type { Product, Recommendation } from "@/lib/types";

async function mutate(productId: string, relatedId: string, action: "pin" | "unpin" | "hide" | "unhide") {
  const response = await fetch("/api/overrides", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ productId, relatedId, action }),
  });
  if (!response.ok) throw new Error("Не удалось сохранить");
}

export function WorkbenchEditor({
  product,
  recommendations,
  hiddenProducts,
  pinnedIds,
}: {
  product: Product;
  recommendations: Recommendation[];
  hiddenProducts: Product[];
  pinnedIds: string[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [matches, setMatches] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debounced.length < 2) {
      setMatches([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    setSearching(true);
    fetch(`/api/products?q=${encodeURIComponent(debounced)}&limit=8`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("search failed");
        const data = (await response.json()) as { items: SerializedProduct[] };
        setMatches(data.items.map(asProduct).filter((item) => item.id !== product.id));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setMatches([]);
      })
      .finally(() => setSearching(false));
    return () => controller.abort();
  }, [debounced, product.id]);

  const run = (relatedId: string, action: "pin" | "unpin" | "hide" | "unhide", ok: string) => {
    startTransition(async () => {
      try {
        await mutate(product.id, relatedId, action);
        toast.success(ok);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка сохранения");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-3">
        {recommendations.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-8 text-center">
            <p className="font-medium">Алгоритм ничего не нашёл</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Закрепите товар вручную через поиск справа — он сразу попадёт в блок на карточке.
            </p>
          </div>
        ) : (
          recommendations.map((item, index) => {
            const pinned = pinnedIds.includes(item.product.id);
            return (
              <div key={item.product.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      #{index + 1} · {item.group} · score {item.score}
                    </p>
                    <p className="font-medium leading-snug">{item.product.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      арт. {item.product.sku} · {item.product.category} · {formatPrice(item.product.price)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={pinned ? "secondary" : "default"}
                      disabled={pending}
                      onClick={() => run(item.product.id, pinned ? "unpin" : "pin", pinned ? "Снято с закрепления" : "Закреплено")}
                    >
                      {pinned ? <PinOff /> : <Pin />}
                      {pinned ? "Открепить" : "Закрепить"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => run(item.product.id, "hide", "Скрыто из выдачи")}
                    >
                      <EyeOff />
                      Скрыть
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <ReasonList reasons={item.reasons} limit={5} />
                </div>
              </div>
            );
          })
        )}
        {hiddenProducts.length > 0 ? (
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="mb-2 text-sm font-medium">Скрытые</p>
            <div className="space-y-2">
              {hiddenProducts.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{item.name}</span>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(item.id, "unhide", "Снова в выдаче")}>
                    Вернуть
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <aside className="h-fit space-y-3 lg:sticky lg:top-20">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">Закрепить вручную</p>
          <p className="mt-1 text-xs text-muted-foreground">Любой артикул каталога Комус можно поставить первым в блоке.</p>
          <div className="relative mt-3">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название или артикул" className="pl-9" />
          </div>
          <div className="mt-3 space-y-2">
            {searching ? <p className="text-xs text-muted-foreground">Ищем…</p> : null}
            {matches.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={pending}
                onClick={() => {
                  setQuery("");
                  run(item.id, "pin", "Товар закреплён");
                }}
                className="w-full rounded-lg border px-3 py-2 text-left text-sm hover:border-primary/40"
              >
                <span className="block truncate font-medium">{item.name}</span>
                <span className="font-mono text-[11px] text-muted-foreground">арт. {item.sku}</span>
              </button>
            ))}
            {debounced.length >= 2 && !searching && matches.length === 0 ? (
              <p className="text-xs text-muted-foreground">Нет совпадений в каталоге.</p>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
