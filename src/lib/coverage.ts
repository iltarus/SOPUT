import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getProduct } from "./catalog";
import type { DepartmentId } from "./types";
import type { CoverageLabel, CoverageRow, CoverageSummary } from "./coverage-label";

export type { CoverageLabel, CoverageRelated, CoverageRow, CoverageSummary } from "./coverage-label";
export { COVERAGE_LABELS, coverageLabel } from "./coverage-label";

type Snapshot = {
  builtAt: string;
  summary: CoverageSummary;
  items: CoverageRow[];
};

function loadSummary(): CoverageSummary {
  const file = path.join(process.cwd(), "data", "komus-coverage.meta.json");
  return JSON.parse(readFileSync(file, "utf8")) as CoverageSummary;
}

function loadSnapshot(): Snapshot {
  const file = path.join(process.cwd(), "data", "komus-coverage.json.gz");
  const buf = gunzipSync(readFileSync(file));
  return JSON.parse(buf.toString("utf8")) as Snapshot;
}

const summaryCache = loadSummary();

let snapshot: Snapshot | null = null;
let haystacks: string[] | null = null;
let byId: Map<string, CoverageRow> | null = null;

function ensureSnapshot(): Snapshot {
  if (snapshot) return snapshot;
  snapshot = loadSnapshot();
  haystacks = snapshot.items.map(
    (row) => `${row.id} ${row.name} ${row.category} ${row.department}`.toLowerCase(),
  );
  byId = new Map(snapshot.items.map((row) => [row.id, row]));
  return snapshot;
}

export function coverageSummary(): CoverageSummary {
  return summaryCache;
}

export function coverageRows(): CoverageRow[] {
  return ensureSnapshot().items;
}

export function getCoverage(id: string): CoverageRow | undefined {
  ensureSnapshot();
  return byId?.get(id);
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

  for (let i = 0; i < ensureSnapshot().items.length; i++) {
    const row = snapshot!.items[i];
    if (options.department && row.department !== options.department) continue;
    if (options.label && row.label !== options.label) continue;
    if (q && row.id !== q && !haystacks![i].includes(q)) continue;
    total += 1;
    if (total > offset && items.length < limit) items.push(row);
  }

  return { total, offset, items };
}
