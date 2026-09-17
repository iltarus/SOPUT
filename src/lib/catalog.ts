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

function mergeCatalog(): Product[] {
  const featuredById = new Map(FEATURED.map((product) => [product.id, product]));
  const seen = new Set<string>();
  const sitemap: Product[] = [];

  for (const row of loadRaw()) {
    const base = fromRaw(row);
    const featured = featuredById.get(row.id);
    sitemap.push(
      featured
        ? { ...base, ...featured, image: base.image || featured.image, path: base.path }
        : base,
    );
    seen.add(row.id);
  }

  const extras = FEATURED.filter((product) => !seen.has(product.id));
  return [...extras, ...sitemap];
}

export const PRODUCTS = mergeCatalog();

const byId = new Map(PRODUCTS.map((product) => [product.id, product]));
const haystacks = PRODUCTS.map((product) =>
  `${product.id} ${product.name} ${product.brand} ${product.sku} ${product.category} ${product.path ?? ""}`.toLowerCase(),
);

export function getProduct(id: string): Product | undefined {
  return byId.get(id);
}

export function listCategories(): string[] {
  return [...new Set(PRODUCTS.map((product) => product.category))].sort((a, b) =>
    a.localeCompare(b, "ru"),
  );
}

export type ProductQuery = {
  q?: string;
  department?: DepartmentId | "";
  category?: string;
  offset?: number;
  limit?: number;
};

export function queryProducts(options: ProductQuery): { total: number; offset: number; items: Product[] } {
  const q = (options.q ?? "").trim().toLowerCase();
  const offset = Math.max(options.offset ?? 0, 0);
  const limit = Math.min(Math.max(options.limit ?? 48, 1), 96);
  const matched: Product[] = [];

  if (q && byId.has(q)) {
    const exact = byId.get(q)!;
    const deptOk = !options.department || exact.department === options.department;
    const catOk = !options.category || exact.category === options.category;
    if (deptOk && catOk) matched.push(exact);
  }

  for (let i = 0; i < PRODUCTS.length; i++) {
    const product = PRODUCTS[i];
    if (matched.length && product.id === q) continue;
    if (options.department && product.department !== options.department) continue;
    if (options.category && product.category !== options.category) continue;
    if (q && !haystacks[i].includes(q)) continue;
    matched.push(product);
  }

  return {
    total: matched.length,
    offset,
    items: matched.slice(offset, offset + limit),
  };
}

export function searchProducts(query: string): Product[] {
  return queryProducts({ q: query, limit: 96 }).items;
}

export function catalogStats() {
  const byDepartment: Record<string, number> = {};
  for (const product of PRODUCTS) {
    byDepartment[product.department] = (byDepartment[product.department] ?? 0) + 1;
  }
  return { total: PRODUCTS.length, byDepartment };
}
