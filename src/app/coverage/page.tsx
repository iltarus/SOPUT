import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { coverageRows, coverageSummary } from "@/lib/coverage";
import { departmentTitle } from "@/lib/departments";
import type { DepartmentId } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function CoveragePage() {
  const summary = coverageSummary();
  const rows = coverageRows();

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Покрытие рекомендаций</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Полный каталог — {summary.total.toLocaleString("ru-RU")} карточек из sitemap. Покрытие считаем по размеченному
        срезу ({summary.featured} SKU): слабые позиции — в начало списка, их разбирают в верстаке.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Каталог" value={summary.total} />
        <Stat label="Полное" value={summary.full} />
        <Stat label="Достаточное" value={summary.ok} />
        <Stat label="Слабое" value={summary.weak} />
        <Stat label="Пусто" value={summary.empty} />
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Товар</th>
              <th className="px-3 py-2 font-medium">Отдел</th>
              <th className="px-3 py-2 font-medium">Выдача</th>
              <th className="px-3 py-2 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2">
                  <Link href={`/workbench/${row.id}`} className="font-medium hover:text-primary">
                    {row.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{departmentTitle(row.department as DepartmentId)}</td>
                <td className="px-3 py-2">{row.count}</td>
                <td className="px-3 py-2">{row.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
