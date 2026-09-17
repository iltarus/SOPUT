import { komusCatalogUrl } from "./format";
import type { DepartmentId, Product } from "./types";

export function serializeProduct(product: Product) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    department: product.department,
    category: product.category,
    path: product.path ?? null,
    image: product.image ?? null,
    price: product.price,
    unit: product.unit,
    pack: product.pack ?? null,
    inStock: product.inStock,
    stockQty: product.stockQty,
    attributes: product.attributes,
    tags: product.tags,
    description: product.description,
    url: `/p/${product.id}`,
    workbenchUrl: `/workbench/${product.id}`,
    komusUrl: komusCatalogUrl(product),
  };
}

export type SerializedProduct = ReturnType<typeof serializeProduct>;

export function asProduct(row: SerializedProduct): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    brand: row.brand,
    department: row.department as DepartmentId,
    category: row.category,
    path: row.path ?? undefined,
    image: row.image ?? undefined,
    price: row.price,
    unit: row.unit,
    pack: row.pack ?? undefined,
    inStock: row.inStock,
    stockQty: row.stockQty,
    attributes: row.attributes,
    tags: row.tags,
    description: row.description,
  };
}

