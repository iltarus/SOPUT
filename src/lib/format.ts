export function formatPrice(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatQty(qty: number, unit: string): string {
  return `${qty} ${unit}`;
}

export function productHref(id: string): string {
  return `/p/${id}`;
}

export function workbenchHref(id: string): string {
  return `/workbench/${id}`;
}

/** Live Komus catalog search — demo SKUs are not real /p/{id}/ pages. */
export function komusCatalogUrl(product: { name: string; brand: string; sku: string }): string {
  const text = [product.brand, product.sku, product.name]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  return `https://www.komus.ru/search?text=${encodeURIComponent(text)}`;
}

