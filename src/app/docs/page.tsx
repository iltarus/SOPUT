import { AppShell } from "@/components/app-shell";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/products",
    desc: "Поиск по каталогу. Параметры: q, department, category.",
  },
  {
    method: "GET",
    path: "/api/products/{id}",
    desc: "Карточка и готовые группы сопутствующих.",
  },
  {
    method: "GET",
    path: "/api/products/{id}/related?limit=8&context=pdp",
    desc: "Виджет «С этим покупают» для страницы товара.",
  },
  {
    method: "POST",
    path: "/api/cart/related",
    desc: "Тело { ids: string[], limit?: number } — рекомендации к корзине.",
  },
  {
    method: "POST",
    path: "/api/overrides",
    desc: "Тело { productId, relatedId, action: pin | unpin | hide | unhide }.",
  },
  {
    method: "GET",
    path: "/api/rules",
    desc: "Правила связок категорий.",
  },
  {
    method: "GET",
    path: "/api/coverage",
    desc: "Покрытие каталога рекомендациями.",
  },
];

export default function DocsPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">API для витрины Комус</h1>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
        Виджет на карточке товара ходит в <code className="rounded bg-muted px-1">/related</code> и рисует группы
        «Расходные материалы» и «С этим покупают». Артикул в демо совпадает с хвостом URL Комус:{" "}
        <code className="rounded bg-muted px-1">komus.ru/p/&#123;id&#125;/</code>.
      </p>
      <div className="mt-6 space-y-3">
        {ENDPOINTS.map((item) => (
          <div key={item.path} className="rounded-xl border bg-card p-4">
            <p className="font-mono text-sm">
              <span className="mr-2 font-semibold text-primary">{item.method}</span>
              {item.path}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>
      <pre className="mt-6 overflow-x-auto rounded-xl border bg-zinc-950 p-4 text-xs leading-6 text-zinc-100">
{`curl -s http://localhost:43127/api/products/148201/related | jq '.groups[] | {title, ids: [.items[].id]}'`}
      </pre>
    </AppShell>
  );
}
