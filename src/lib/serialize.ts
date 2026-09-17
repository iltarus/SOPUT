import { komusCatalogUrl } from "./format";
import type { Product } from "./types";

export function serializeProduct(product: Product) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    brand: product.brand,
    department: product.department,
    category: product.category,
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
