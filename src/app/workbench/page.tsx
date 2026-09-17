import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { WorkbenchSearch } from "@/components/workbench-search";
import { PRODUCTS as FEATURED } from "@/lib/catalog-featured";
import { catalogStats } from "@/lib/catalog";
import { recommend } from "@/lib/recommend";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

export default function WorkbenchIndexPage() {
  const stats = catalogStats();
  const rows = FEATURED.map((product) => {
    const recs = recommend(product.id, { limit: 8 });
    return { product, recs };
  }).sort((a, b) => a.recs.length - b.recs.length);

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Верстак мерчандайзера</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Полный каталог — {stats.total.toLocaleString("ru-RU")} карточек Комус. Ниже размеченный срез со слабой выдачей.
        Любой артикул из sitemap открывается поиском.
      </p>
      <div className="mt-5">
        <WorkbenchSearch />
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Товар</th>
              <th className="px-3 py-2 font-medium">Категория</th>
              <th className="px-3 py-2 font-medium">Сопут.</th>
              <th className="px-3 py-2 font-medium">Топ выдачи</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ product, recs }) => (
              <tr key={product.id} className="border-t">
                <td className="px-3 py-3">
                  <Link href={`/workbench/${product.id}`} className="font-medium hover:text-primary">
                    {product.name}
                  </Link>
                  <p className="font-mono text-[11px] text-muted-foreground">арт. {product.sku}</p>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{product.category}</td>
                <td className="px-3 py-3">{recs.length}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {recs[0]
                    ? `${recs[0].product.name.split(",")[0]} · ${formatPrice(recs[0].product.price)}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
