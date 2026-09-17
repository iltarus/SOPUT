import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CatalogBrowser } from "@/components/catalog-browser";
import { catalogStats, queryProducts } from "@/lib/catalog";
import { coverageSummary } from "@/lib/coverage";
import { DEPARTMENTS } from "@/lib/departments";
import { ORDER_VOLUME } from "@/lib/affinity";
import { RULES } from "@/lib/rules";
import type { DepartmentId } from "@/lib/types";

export const dynamic = "force-dynamic";

const PRODUCT_EXAMPLES = [
  { href: "/p/148201", label: "HP LaserJet 107a" },
  { href: "/p/1042218", label: "HP LaserJet Enterprise" },
  { href: "/p/148210", label: "МФУ Epson EcoTank" },
  { href: "/p/1271903", label: "Степлер Attache" },
  { href: "/p/120260", label: "Маркерная доска" },
  { href: "/p/200601", label: "Кофемашина" },
  { href: "/p/180401", label: "Короб картонный" },
  { href: "/p/210701", label: "Огнетушитель" },
  { href: "/p/150101", label: "Ноутбук" },
  { href: "/p/160201", label: "Офисное кресло" },
];

const CATEGORY_EXAMPLES: { id: DepartmentId; label: string }[] = [
  { id: "print", label: "Оргтехника" },
  { id: "stationery", label: "Канцтовары" },
  { id: "paper", label: "Бумага" },
  { id: "packaging", label: "Упаковка" },
  { id: "food", label: "Кофе и кухня" },
  { id: "cleaning", label: "Хозтовары" },
  { id: "furniture", label: "Мебель" },
  { id: "computers", label: "Компьютеры" },
  { id: "electronics", label: "Электроника" },
  { id: "appliances", label: "Бытовая техника" },
  { id: "workwear", label: "Спецодежда" },
  { id: "safety", label: "Пожарная безопасность" },
  { id: "school", label: "Учёба и творчество" },
  { id: "home", label: "Дом и дача" },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string }>;
}) {
  const stats = catalogStats();
  const summary = coverageSummary();
  const params = await searchParams;
  const departmentIds = new Set(DEPARTMENTS.map((item) => item.id));
  const initialDepartment = departmentIds.has(params.department as DepartmentId)
    ? (params.department as DepartmentId)
    : "all";
  const page = queryProducts({
    department: initialDepartment === "all" ? undefined : initialDepartment,
    limit: 48,
  });

  return (
    <AppShell>
      <section className="mb-8 overflow-hidden rounded-2xl bg-primary px-5 py-7 text-primary-foreground sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">Для каталога komus.ru</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Сопутствующие товары, которые добирают чек, а не дублируют карточку
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
          Сервис собирает расходники, совместимые картриджи и позиции «с этим покупают» — как блок на карточке Комус.
          В каталоге все {stats.total.toLocaleString("ru-RU")} карточек из sitemap komus.ru.
        </p>
        <div className="mt-5 space-y-3">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/65">Примеры товаров</p>
            <div className="flex flex-wrap gap-2 text-sm">
              {PRODUCT_EXAMPLES.map((item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    index === 0
                      ? "rounded-lg bg-white px-3 py-2 font-medium text-primary"
                      : "rounded-lg bg-white/15 px-3 py-2 font-medium hover:bg-white/25"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/65">Категории каталога</p>
            <div className="flex flex-wrap gap-2 text-sm">
              {CATEGORY_EXAMPLES.map((item) => (
                <Link
                  key={item.id}
                  href={`/?department=${item.id}#catalog`}
                  className="rounded-lg bg-white/15 px-3 py-2 font-medium hover:bg-white/25"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Товаров в каталоге" value={stats.total.toLocaleString("ru-RU")} hint="sitemap komus.ru" />
        <Kpi label="Покрытие витрины" value={`${summary.coveragePct}%`} hint={`${summary.total.toLocaleString("ru-RU")} карточек`} />
        <Kpi label="Правил связок" value={String(RULES.length)} hint="категория → категория" />
        <Kpi label="Заказов в модели" value={String(ORDER_VOLUME)} hint="совместные покупки" />
      </div>

      <div id="catalog">
        <CatalogBrowser
          key={initialDepartment}
          initialItems={page.items}
          initialTotal={page.total}
          initialDepartment={initialDepartment}
        />
      </div>
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
