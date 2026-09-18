import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getProduct } from "./catalog";
import type { DepartmentId } from "./types";
import type { CoverageLabel, CoverageRow, CoverageSummary } from "./coverage-label";

export type { CoverageLabel, CoverageRelated, CoverageRow, CoverageSummary } from "./coverage-label";
export { COVERAGE_LABELS, coverageLabel } from "./coverage-label";

function loadSummary(): CoverageSummary {
  const file = path.join(process.cwd(), "data", "komus-coverage.meta.json");
  return JSON.parse(readFileSync(file, "utf8")) as CoverageSummary;
}

const summaryCache = loadSummary();
const NDJSON = path.join(process.cwd(), "data", "komus-coverage.ndjson.gz");

function eachCoverageRow(fn: (row: CoverageRow) => boolean | void) {
  const text = gunzipSync(readFileSync(NDJSON)).toString("utf8");
  for (const line of text.split("\n")) {
    if (!line) continue;
    const stop = fn(JSON.parse(line) as CoverageRow);
    if (stop === false) return;
  }
}

export function coverageSummary(): CoverageSummary {
  return summaryCache;
}

export function getCoverage(id: string): CoverageRow | undefined {
  let found: CoverageRow | undefined;
  eachCoverageRow((row) => {
    if (row.id !== id) return;
    found = row;
    return false;
  });
  return found;
}

export function serializeCoverageRow(row: CoverageRow) {
  return {
    ...row,
    related: row.related.map((item) => ({
      ...item,
      name: getProduct(item.id)?.name ?? item.id,
    })),
  };
}

export type CoverageQuery = {
  q?: string;
  department?: DepartmentId | "";
  label?: CoverageLabel | "";
  offset?: number;
  limit?: number;
};

export function queryCoverage(options: CoverageQuery): { total: number; offset: number; items: CoverageRow[] } {
  const q = (options.q ?? "").trim().toLowerCase();
  const offset = Math.max(options.offset ?? 0, 0);
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
  const items: CoverageRow[] = [];
  let total = 0;

  eachCoverageRow((row) => {
    if (options.department && row.department !== options.department) return;
    if (options.label && row.label !== options.label) return;
    if (q && row.id !== q && !`${row.id} ${row.name} ${row.category} ${row.department}`.toLowerCase().includes(q)) {
      return;
    }
    total += 1;
    if (total > offset && items.length < limit) items.push(row);
  });

  return { total, offset, items };
}
