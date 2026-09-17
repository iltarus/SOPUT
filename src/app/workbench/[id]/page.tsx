import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { WorkbenchEditor } from "@/components/workbench-editor";
import { PRODUCTS, getProduct } from "@/lib/catalog";
import { readOverrides } from "@/lib/overrides";
import { recommend } from "@/lib/recommend";

export const dynamic = "force-dynamic";

export default async function WorkbenchProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  const recommendations = recommend(id, { limit: 16, diversify: false });
  const overrides = readOverrides();

  return (
    <AppShell>
      <nav className="mb-3 text-xs text-muted-foreground">
        <Link href="/workbench" className="hover:text-foreground">
          Верстак
        </Link>
        <span className="mx-1">/</span>
        <span>арт. {product.sku}</span>
      </nav>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <p className="text-sm text-muted-foreground">
            {product.category} · бренд {product.brand}. На карточке сайта это выглядит так:{" "}
            <Link href={`/p/${product.id}`} className="underline">
              витрина
            </Link>
            .
          </p>
        </div>
      </div>
      <WorkbenchEditor
        product={product}
        recommendations={recommendations}
        catalog={PRODUCTS}
        hiddenIds={overrides.hidden[id] ?? []}
        pinnedIds={overrides.pins[id] ?? []}
      />
    </AppShell>
  );
}
