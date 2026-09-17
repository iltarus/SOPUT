import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ReasonList } from "@/components/reason-list";
import { formatPrice } from "@/lib/format";
import type { RecommendationGroup } from "@/lib/types";

export function RecommendationRail({
  groups,
  sourceId,
}: {
  groups: RecommendationGroup[];
  sourceId?: string;
}) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-8 text-center">
        <p className="font-medium">Сопутствующих товаров пока нет</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Откройте верстак и закрепите расходники вручную или добавьте правило категории.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.id} className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{group.title}</h2>
            <p className="text-xs text-muted-foreground">{group.items.length} поз.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {group.items.map((item) => (
              <div key={item.product.id} className="space-y-2">
                <ProductCard product={item.product} href={`/p/${item.product.id}`} compact />
                <ReasonList reasons={item.reasons.filter((reason) => reason.type !== "stock")} limit={2} />
                <p className="text-[11px] text-muted-foreground">
                  {formatPrice(item.product.price)} · score {item.score}
                </p>
              </div>
            ))}
          </div>
          {group.id === "together" && sourceId ? (
            <p className="text-xs text-muted-foreground">
              Блок как на витрине Комус. Состав правится в{" "}
              <Link href={`/workbench/${sourceId}`} className="underline">
                верстаке
              </Link>
              .
            </p>
          ) : null}
        </section>
      ))}
    </div>
  );
}
