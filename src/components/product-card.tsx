import Link from "next/link";
import { ProductVisual } from "@/components/product-visual";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  href,
  recCount,
  compact,
}: {
  product: Product;
  href?: string;
  recCount?: number;
  compact?: boolean;
}) {
  const content = (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
        compact && "rounded-lg",
      )}
    >
      <ProductVisual department={product.department} brand={product.brand} className={compact ? "aspect-[5/3]" : undefined} />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-mono text-[11px] text-muted-foreground">арт. {product.sku}</p>
          {product.inStock ? (
            <Badge variant="secondary" className="text-[10px]">
              {product.stockQty} шт
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[10px]">
              Нет
            </Badge>
          )}
        </div>
        <h3 className="line-clamp-3 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
          {product.name}
        </h3>
        <p className="mt-auto pt-1 text-base font-semibold tracking-tight">{formatPrice(product.price)}</p>
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="truncate">{product.category}</span>
          {typeof recCount === "number" ? <span>{recCount} сопут.</span> : null}
        </div>
      </div>
    </article>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}
