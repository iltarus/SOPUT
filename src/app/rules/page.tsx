import { AppShell } from "@/components/app-shell";
import { RULES } from "@/lib/rules";

export default function RulesPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Правила связок</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Категория-источник → категория-сопутствие. Это не «похожие товары»: степлер ведёт на скобы, а не на другой
        степлер. SKU-совместимость (картридж к конкретной модели) задаётся отдельно и важнее правила.
      </p>
      <div className="mt-6 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Откуда</th>
              <th className="px-3 py-2 font-medium">Куда</th>
              <th className="px-3 py-2 font-medium">Тип</th>
              <th className="px-3 py-2 font-medium">Вес</th>
              <th className="px-3 py-2 font-medium">Зачем</th>
            </tr>
          </thead>
          <tbody>
            {RULES.map((rule) => (
              <tr key={rule.id} className="border-t">
                <td className="px-3 py-2">{rule.fromCategory}</td>
                <td className="px-3 py-2">{rule.toCategory}</td>
                <td className="px-3 py-2 text-muted-foreground">{rule.kind}</td>
                <td className="px-3 py-2 font-mono text-xs">{rule.weight.toFixed(2)}</td>
                <td className="px-3 py-2 text-muted-foreground">{rule.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
