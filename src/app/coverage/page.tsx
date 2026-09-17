import { AppShell } from "@/components/app-shell";
import { CoverageBrowser } from "@/components/coverage-browser";
import { coverageSummary, queryCoverage, serializeCoverageRow } from "@/lib/coverage";

export const dynamic = "force-dynamic";

export default function CoveragePage() {
  const summary = coverageSummary();
  const page = queryCoverage({ limit: 50 });

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Покрытие рекомендаций</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Полный прогон по {summary.total.toLocaleString("ru-RU")} карточкам каталога. Слабые и пустые — в начале списка.
        Сопутствующие из снимка; на карточке и в верстаке выдача считается живьём.
        {summary.builtAt ? ` Снимок: ${new Date(summary.builtAt).toLocaleString("ru-RU")}.` : null}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Каталог" value={summary.total} />
        <Stat label="Полное" value={summary.full} />
        <Stat label="Достаточное" value={summary.ok} />
        <Stat label="Слабое" value={summary.weak} />
        <Stat label="Пусто" value={summary.empty} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Покрытие витрины: <span className="font-semibold text-foreground">{summary.coveragePct}%</span> (полное +
        достаточное, 3+ сопутствующих).
      </p>
      <div className="mt-6">
        <CoverageBrowser initialItems={page.items.map(serializeCoverageRow)} initialTotal={page.total} />
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value.toLocaleString("ru-RU")}</p>
    </div>
  );
}
