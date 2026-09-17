export function formatPrice(value: number): string {
  if (!value) return "Цена на komus.ru";
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

/** Live /p/{id}/ when the SKU came from the Komus sitemap; otherwise search. */
export function komusCatalogUrl(product: {
  id?: string;
  name: string;
  brand: string;
  sku: string;
  path?: string;
}): string {
  if (product.path && product.id && /^\d+$/.test(product.id)) {
    return `https://www.komus.ru/p/${product.id}/`;
  }
  const keepSku = Boolean(product.sku) && product.sku !== product.id && /[A-Za-zА-Яа-я]/.test(product.sku);
  const text = [product.brand, keepSku ? product.sku : null, product.name]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
  return `https://www.komus.ru/search?text=${encodeURIComponent(text)}`;
}

