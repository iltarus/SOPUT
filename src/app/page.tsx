import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CatalogBrowser } from "@/components/catalog-browser";
import { PRODUCTS } from "@/lib/catalog";
import { coverageSummary, coverageRows } from "@/lib/coverage";
import { ORDER_VOLUME } from "@/lib/affinity";
import { RULES } from "@/lib/rules";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const summary = coverageSummary();
  const coverage = coverageRows();

  return (
    <AppShell>
      <section className="mb-8 overflow-hidden rounded-2xl bg-primary px-5 py-7 text-primary-foreground sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">Для каталога komus.ru</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Сопутствующие товары, которые добирают чек, а не дублируют карточку
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
          Сервис собирает расходники, совместимые картриджи и позиции «с этим покупают» — как блок на карточке Комус.
          Мерчандайзер может закрепить или скрыть выдачу, сайт забирает готовый JSON.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          <Link href="/p/148201" className="rounded-lg bg-white px-3 py-2 font-medium text-primary">
            Пример: HP LaserJet 107a
          </Link>
          <Link href="/p/200601" className="rounded-lg bg-white/15 px-3 py-2 font-medium">
            Кофемашина
          </Link>
          <Link href="/workbench/210701" className="rounded-lg bg-white/15 px-3 py-2 font-medium">
            Верстак: огнетушитель
          </Link>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Товаров в срезе" value={String(summary.total)} hint="демо-каталог Комус" />
        <Kpi label="Покрытие витрины" value={`${summary.coveragePct}%`} hint="3+ сопутствующих" />
        <Kpi label="Правил связок" value={String(RULES.length)} hint="категория → категория" />
        <Kpi label="Заказов в модели" value={String(ORDER_VOLUME)} hint="совместные покупки" />
      </div>

      <CatalogBrowser products={PRODUCTS} coverage={coverage} />
    </AppShell>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
