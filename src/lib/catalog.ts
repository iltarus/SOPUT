import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PRODUCTS as FEATURED } from "./catalog-featured";
import type { DepartmentId, Product } from "./types";

type RawRow = {
  id: string;
  n: string;
  b: string;
  d: DepartmentId;
  c: string;
  p: string;
  i: string;
};

function loadRaw(): RawRow[] {
  const file = path.join(process.cwd(), "data", "komus-catalog.json.gz");
  const buf = gunzipSync(readFileSync(file));
  return JSON.parse(buf.toString("utf8")) as RawRow[];
}

const featuredById = new Map(FEATURED.map((product) => [product.id, product]));
const packed: RawRow[] = loadRaw();
const packedById = new Map(packed.map((row) => [row.id, row]));
const extras = FEATURED.filter((product) => !packedById.has(product.id));
const extraById = new Map(extras.map((product) => [product.id, product]));

const extraHay = extras.map(
  (product) =>
    `${product.id} ${product.name} ${product.brand} ${product.sku} ${product.category} ${product.path ?? ""}`.toLowerCase(),
);
const packedHay = packed.map((row) => `${row.id} ${row.n} ${row.b} ${row.c} ${row.p}`.toLowerCase());

function fromRaw(row: RawRow): Product {
  return {
    id: row.id,
    sku: row.id,
    name: row.n,
    brand: row.b || "Комус",
    department: row.d,
    category: row.c,
    path: row.p || undefined,
    image: row.i || undefined,
    price: 0,
    unit: "шт",
    inStock: true,
    stockQty: 0,
    attributes: {},
    tags: [],
    description: "",
  };
}

function hydrate(row: RawRow): Product {
  const featured = featuredById.get(row.id);
  const base = fromRaw(row);
  if (!featured) return base;
  return { ...base, ...featured, image: base.image || featured.image, path: base.path };
}

export function getProduct(id: string): Product | undefined {
  const row = packedById.get(id);
  if (row) return hydrate(row);
  return extraById.get(id);
}

export function listCategories(): string[] {
  const set = new Set<string>(extras.map((product) => product.category));
  for (const row of packed) set.add(row.c);
  return [...set].sort((a, b) => a.localeCompare(b, "ru"));
}

export type ProductQuery = {
  q?: string;
  department?: DepartmentId | "";
  category?: string;
  offset?: number;
  limit?: number;
};

function matchesFilters(department: DepartmentId, category: string, options: ProductQuery, hay: string, id: string) {
  if (options.department && department !== options.department) return false;
  if (options.category && category !== options.category) return false;
  const q = (options.q ?? "").trim().toLowerCase();
  if (q && id !== q && !hay.includes(q)) return false;
  return true;
}

export function queryProducts(options: ProductQuery): { total: number; offset: number; items: Product[] } {
  const q = (options.q ?? "").trim().toLowerCase();
  const offset = Math.max(options.offset ?? 0, 0);
  const limit = Math.min(Math.max(options.limit ?? 48, 1), 96);
  const items: Product[] = [];
  let total = 0;

  const take = (product: Product) => {
    total += 1;
    if (total > offset && items.length < limit) items.push(product);
  };

  if (q) {
    const exact = getProduct(q);
    if (exact && matchesFilters(exact.department, exact.category, { ...options, q: "" }, "", exact.id)) {
      take(exact);
    }
  }

  for (let i = 0; i < extras.length; i++) {
    const product = extras[i];
    if (q && product.id === q) continue;
    if (!matchesFilters(product.department, product.category, options, extraHay[i], product.id)) continue;
    take(product);
  }

  for (let i = 0; i < packed.length; i++) {
    const row = packed[i];
    if (q && row.id === q) continue;
    if (!matchesFilters(row.d, row.c, options, packedHay[i], row.id)) continue;
    total += 1;
    if (total > offset && items.length < limit) items.push(hydrate(row));
  }

  return { total, offset, items };
}

export function searchProducts(query: string): Product[] {
  return queryProducts({ q: query, limit: 96 }).items;
}

export function catalogStats() {
  const byDepartment: Record<string, number> = {};
  for (const product of extras) {
    byDepartment[product.department] = (byDepartment[product.department] ?? 0) + 1;
  }
  for (const row of packed) {
    byDepartment[row.d] = (byDepartment[row.d] ?? 0) + 1;
  }
  return { total: extras.length + packed.length, byDepartment };
}

export type CatalogMeta = {
  id: string;
  name: string;
  department: DepartmentId;
  category: string;
};

export function eachCatalogMeta(fn: (row: CatalogMeta) => boolean | void) {
  for (const product of extras) {
    const stop = fn({
      id: product.id,
      name: product.name,
      department: product.department,
      category: product.category,
    });
    if (stop === false) return;
  }
  for (const row of packed) {
    const stop = fn({ id: row.id, name: row.n, department: row.d, category: row.c });
    if (stop === false) return;
  }
}

/** Collect live products whose name/category match, extras first. */
export function collectByText(
  pred: (name: string, category: string, id: string) => boolean,
  limit: number,
): Product[] {
  const out: Product[] = [];
  for (const product of extras) {
    if (!pred(product.name, product.category, product.id)) continue;
    out.push(product);
    if (out.length >= limit) return out;
  }
  for (const row of packed) {
    if (!pred(row.n, row.c, row.id)) continue;
    out.push(hydrate(row));
    if (out.length >= limit) return out;
  }
  return out;
}
