"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COVERAGE_LABELS, type CoverageLabel, type CoverageRow } from "@/lib/coverage-label";
import { DEPARTMENTS, departmentTitle } from "@/lib/departments";
import { cn } from "@/lib/utils";
import type { DepartmentId } from "@/lib/types";

type Related = CoverageRow["related"][number] & { name?: string };
type Row = Omit<CoverageRow, "related"> & { related: Related[] };

const PAGE_SIZE = 50;

export function CoverageBrowser({
  initialItems,
  initialTotal,
}: {
  initialItems: Row[];
  initialTotal: number;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [department, setDepartment] = useState<DepartmentId | "all">("all");
  const [label, setLabel] = useState<CoverageLabel | "all">("all");
  const [items, setItems] = useState<Row[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const isInitial = debounced === "" && department === "all" && label === "all";
    if (isInitial) {
      setItems(initialItems);
      setTotal(initialTotal);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    const controller = new AbortController();
    setLoading(true);
    fetchCoverage({ q: debounced, department, label, offset: 0, signal: controller.signal })
      .then((payload) => {
        if (id !== requestId.current) return;
        setItems(payload.items);
        setTotal(payload.total);
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
    return () => controller.abort();
  }, [debounced, department, label, initialItems, initialTotal]);

  const loadMore = () => {
    const id = ++requestId.current;
    const controller = new AbortController();
    setLoading(true);
    fetchCoverage({ q: debounced, department, label, offset: items.length, signal: controller.signal })
      .then((payload) => {
        if (id !== requestId.current) return;
        setItems((current) => {
          const seen = new Set(current.map((row) => row.id));
          return [...current, ...payload.items.filter((row) => !seen.has(row.id))];
        });
        setTotal(payload.total);
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по названию или артикулу"
            className="bg-card pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {total.toLocaleString("ru-RU")} позиций
          {loading ? " · загрузка…" : null}
        </p>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Chip active={label === "all"} onClick={() => setLabel("all")}>
          Все статусы
        </Chip>
        {COVERAGE_LABELS.map((item) => (
          <Chip key={item} active={label === item} onClick={() => setLabel(item)}>
            {item}
          </Chip>
        ))}
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Chip active={department === "all"} onClick={() => setDepartment("all")}>
          Все отделы
        </Chip>
        {DEPARTMENTS.map((item) => (
          <Chip key={item.id} active={department === item.id} onClick={() => setDepartment(item.id)}>
            {item.title}
          </Chip>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Товар</th>
              <th className="px-3 py-2 font-medium">Отдел</th>
              <th className="px-3 py-2 font-medium">Выдача</th>
              <th className="px-3 py-2 font-medium">Сопутствующие</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  Ничего не нашлось в снимке покрытия
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="border-t align-top">
                  <td className="px-3 py-2">
                    <Link href={`/workbench/${row.id}`} className="font-medium hover:text-primary">
                      {row.name}
                    </Link>
                    <p className="font-mono text-[11px] text-muted-foreground">арт. {row.id}</p>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {departmentTitle(row.department as DepartmentId)}
                  </td>
                  <td className="px-3 py-2">
                    {row.count} · {row.label}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {row.related.length === 0 ? (
                      "—"
                    ) : (
                      <ul className="space-y-0.5">
                        {row.related.slice(0, 3).map((item) => (
                          <li key={item.id}>
                            <Link href={`/p/${item.id}`} className="hover:text-primary">
                              {item.name ?? item.id}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {items.length < total ? (
        <div className="flex justify-center">
          <Button type="button" variant="outline" disabled={loading} onClick={loadMore}>
            Показать ещё
          </Button>
        </div>
      ) : null}
    </div>
  );
}

async function fetchCoverage({
  q,
  department,
  label,
  offset,
  signal,
}: {
  q: string;
  department: DepartmentId | "all";
  label: CoverageLabel | "all";
  offset: number;
  signal: AbortSignal;
}) {
  const params = new URLSearchParams({ offset: String(offset), limit: String(PAGE_SIZE) });
  if (q) params.set("q", q);
  if (department !== "all") params.set("department", department);
  if (label !== "all") params.set("label", label);
  const response = await fetch(`/api/coverage?${params}`, { signal });
  if (!response.ok) throw new Error("Не удалось загрузить покрытие");
  return (await response.json()) as { total: number; items: Row[] };
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}
