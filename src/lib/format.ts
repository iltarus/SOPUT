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
