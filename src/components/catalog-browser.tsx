"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { DEPARTMENTS } from "@/lib/departments";
import { cn } from "@/lib/utils";
import type { CoverageRow } from "@/lib/coverage";
import type { DepartmentId, Product } from "@/lib/types";

export function CatalogBrowser({
  products,
  coverage,
}: {
  products: Product[];
  coverage: CoverageRow[];
}) {
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState<DepartmentId | "all">("all");
  const coverageMap = useMemo(
    () => new Map(coverage.map((row) => [row.id, row])),
    [coverage],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      if (department !== "all" && product.department !== department) return false;
      if (!q) return true;
      const hay = `${product.name} ${product.brand} ${product.sku} ${product.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, query, department]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию, бренду или артикулу"
            className="bg-card pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">{filtered.length} товаров</p>
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
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center">
          <p className="font-medium">Ничего не нашлось</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Попробуйте артикул Комус, бренд или категорию — например «степлер» или «Epson».
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              href={`/p/${product.id}`}
              recCount={coverageMap.get(product.id)?.count}
            />
          ))}
        </div>
      )}
      <p className="text-center text-xs text-muted-foreground">
        Нужно править выдачу? Откройте{" "}
        <Link href="/workbench" className="underline">
          верстак мерчандайзера
        </Link>
        .
      </p>
    </div>
  );
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
