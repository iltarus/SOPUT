import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { AppShell } from "@/components/app-shell";
import { ProductVisual } from "@/components/product-visual";
import { RecommendationRail } from "@/components/recommendation-rail";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getProduct } from "@/lib/catalog";
import { departmentTitle } from "@/lib/departments";
import { formatPrice, komusCatalogUrl } from "@/lib/format";
import { relatedPayload } from "@/lib/recommend";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  const related = relatedPayload(id, { limit: 12, context: "pdp" });

  return (
    <AppShell>
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Каталог
        </Link>
        <span className="mx-1">/</span>
        <span>{departmentTitle(product.department)}</span>
        <span className="mx-1">/</span>
        <span>{product.category}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <ProductVisual
          department={product.department}
          brand={product.brand}
          className="min-h-64 rounded-2xl sm:min-h-80"
        />
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">арт. {product.sku}</Badge>
            {product.inStock ? <Badge>В наличии · {product.stockQty} шт</Badge> : <Badge variant="destructive">Нет в наличии</Badge>}
            <Badge variant="outline">{related.coverage.label}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{product.name}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{product.description}</p>
          <p className="text-3xl font-semibold">{formatPrice(product.price)}</p>
          <p className="text-xs text-muted-foreground">
            {product.pack ? `${product.pack} · ` : null}
            {product.unit} · бренд {product.brand}
          </p>
          <AddToCartButton product={product} />
          <div className="flex flex-wrap gap-2">
            <Link href={`/workbench/${product.id}`} className={cn(buttonVariants({ variant: "outline" }))}>
              Открыть в верстаке
            </Link>
            <a
              href={komusCatalogUrl(product)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              Карточка на komus.ru
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <RecommendationRail groups={related.groups} sourceId={product.id} />
      </div>
    </AppShell>
  );
}
