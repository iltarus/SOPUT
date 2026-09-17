import { PRODUCTS as FEATURED } from "./catalog-featured";
import { catalogStats } from "./catalog";
import { recommend } from "./recommend";

export type CoverageRow = {
  id: string;
  name: string;
  category: string;
  department: string;
  count: number;
  score: number;
  label: string;
};

export function coverageRows(): CoverageRow[] {
  return FEATURED.map((product) => {
    const recs = recommend(product.id, { limit: 8 });
    const top = recs[0]?.score ?? 0;
    let label = "Нет рекомендаций";
    if (recs.length >= 6) label = "Полное";
    else if (recs.length >= 3) label = "Достаточное";
    else if (recs.length >= 1) label = "Слабое";
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      department: product.department,
      count: recs.length,
      score: top,
      label,
    };
  }).sort((a, b) => a.count - b.count || a.score - b.score);
}

export function coverageSummary() {
  const rows = coverageRows();
  const full = rows.filter((row) => row.label === "Полное").length;
  const ok = rows.filter((row) => row.label === "Достаточное").length;
  const weak = rows.filter((row) => row.label === "Слабое").length;
  const empty = rows.filter((row) => row.label === "Нет рекомендаций").length;
  const catalog = catalogStats();
  return {
    total: catalog.total,
    featured: rows.length,
    full,
    ok,
    weak,
    empty,
    coveragePct: rows.length ? Math.round(((full + ok) / rows.length) * 100) : 0,
  };
}
