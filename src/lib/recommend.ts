import { affinityFor } from "./affinity";
import { PRODUCTS, getProduct } from "./catalog";
import { compatibilityFor } from "./compatibility";
import { readOverrides } from "./overrides";
import { findRule } from "./rules";
import type {
  Product,
  Reason,
  RecommendOptions,
  Recommendation,
  RecommendationGroup,
  RelatedResponse,
} from "./types";

const GROUP_TITLES: Record<Recommendation["group"], string> = {
  pinned: "Закреплено мерчандайзером",
  consumables: "Расходные материалы",
  equipment: "Подходит к этой технике",
  together: "С этим покупают",
};

function attributeBoost(source: Product, candidate: Product): { score: number; labels: string[] } {
  const labels: string[] = [];
  let score = 0;
  const keys = ["format", "size", "oem", "width", "diameter", "color"];

  for (const key of keys) {
    const left = source.attributes[key];
    const right = candidate.attributes[key];
    if (left && right && left === right) {
      score += key === "oem" || key === "diameter" || key === "format" ? 12 : 6;
      labels.push(`Совпадает ${attrLabel(key)}: ${left}`);
    }
  }

  return { score, labels };
}

function attrLabel(key: string): string {
  const map: Record<string, string> = {
    format: "формат",
    size: "размер",
    oem: "OEM-номер",
    width: "ширина",
    diameter: "диаметр",
    color: "цвет",
  };
  return map[key] ?? key;
}

function pickGroup(source: Product, rec: Omit<Recommendation, "group">): Recommendation["group"] {
  if (rec.reasons.some((reason) => reason.type === "pin")) return "pinned";

  const compat = rec.reasons.find((reason) => reason.type === "compat");
  if (compat) {
    const candidateIsDevice = rec.product.price > source.price * 1.6 && source.tags.includes("расходник");
    if (candidateIsDevice) return "equipment";
    const ruleConsumable = rec.reasons.some(
      (reason) => reason.type === "rule" && reason.label.toLowerCase().includes("расход"),
    );
    if (rec.product.tags.includes("расходник") || rec.product.price < source.price || ruleConsumable) {
      return "consumables";
    }
  }

  const rule = rec.reasons.find((reason) => reason.type === "rule");
  if (rule && rec.product.tags.includes("расходник") && rec.product.price <= source.price) {
    return "consumables";
  }

  return "together";
}

function scoreCandidate(source: Product, candidate: Product, pinIndex: number): Recommendation | null {
  const reasons: Reason[] = [];
  let score = 0;

  if (pinIndex >= 0) {
    const weight = 1000 - pinIndex * 15;
    score += weight;
    reasons.push({ type: "pin", label: "Закреплено мерчандайзером", weight });
  }

  const compat = compatibilityFor(source.id, candidate.id);
  if (compat) {
    const weight = 92 * compat.strength;
    score += weight;
    reasons.push({ type: "compat", label: compat.label, weight });
  }

  const rule = findRule(source.category, candidate.category);
  if (rule) {
    const weight = 48 * rule.weight;
    score += weight;
    reasons.push({ type: "rule", label: rule.reason, weight });
  }

  const affinity = affinityFor(source.id, candidate.id);
  if (affinity && affinity.count >= 5) {
    const normalizedLift = Math.min(affinity.lift / 6, 1.4);
    const weight = 28 * normalizedLift + Math.min(affinity.count / 8, 8);
    score += weight;
    reasons.push({
      type: "affinity",
      label: `В ${affinity.count} заказах покупали вместе`,
      weight,
    });
  }

  if (candidate.brand === source.brand && candidate.category !== source.category) {
    score += 8;
    reasons.push({ type: "brand", label: `Тот же бренд: ${source.brand}`, weight: 8 });
  }

  const attrs = attributeBoost(source, candidate);
  if (attrs.score > 0 && (compat || rule)) {
    score += attrs.score;
    reasons.push({ type: "attr", label: attrs.labels[0], weight: attrs.score });
  }

  if (candidate.inStock) {
    score += 5;
    reasons.push({ type: "stock", label: "В наличии", weight: 5 });
  } else {
    score -= 22;
    reasons.push({ type: "stock", label: "Нет в наличии — опускаем в выдаче", weight: -22 });
  }

  const isSubstitute =
    candidate.category === source.category && pinIndex < 0 && !compat && !affinity;
  if (isSubstitute) {
    score -= 28;
  }

  if (reasons.every((reason) => reason.type === "stock") && pinIndex < 0) {
    return null;
  }

  if (score < 12 && pinIndex < 0) return null;

  const base = {
    product: candidate,
    score: Math.round(score * 10) / 10,
    reasons: reasons.sort((a, b) => b.weight - a.weight),
  };

  return { ...base, group: pickGroup(source, base) };
}

function diversify(ranked: Recommendation[], limit: number): Recommendation[] {
  const picked: Recommendation[] = [];
  const perCategory = new Map<string, number>();

  for (const item of ranked) {
    if (picked.length >= limit) break;
    const count = perCategory.get(item.product.category) ?? 0;
    const isPinned = item.group === "pinned";
    const cap = item.group === "consumables" ? 4 : 2;
    if (!isPinned && count >= cap && picked.length < limit - 1) continue;
    picked.push(item);
    perCategory.set(item.product.category, count + 1);
  }

  if (picked.length < limit) {
    for (const item of ranked) {
      if (picked.length >= limit) break;
      if (!picked.includes(item)) picked.push(item);
    }
  }

  return picked;
}

export function recommend(productId: string, options: RecommendOptions = {}): Recommendation[] {
  const source = getProduct(productId);
  if (!source) return [];

  const overrides = readOverrides();
  const hidden = new Set(overrides.hidden[productId] ?? []);
  const pins = overrides.pins[productId] ?? [];
  const exclude = new Set([productId, ...(options.excludeIds ?? [])]);
  const limit = options.limit ?? 12;

  const ranked: Recommendation[] = [];

  for (const candidate of PRODUCTS) {
    if (exclude.has(candidate.id) || hidden.has(candidate.id)) continue;
    const pinIndex = pins.indexOf(candidate.id);
    const scored = scoreCandidate(source, candidate, pinIndex);
    if (scored) ranked.push(scored);
  }

  ranked.sort((a, b) => b.score - a.score);
  const sliced = options.diversify === false ? ranked.slice(0, limit) : diversify(ranked, limit);
  return sliced;
}

export function recommendForCart(productIds: string[], limit = 10): Recommendation[] {
  const unique = [...new Set(productIds.filter((id) => getProduct(id)))];
  const merged = new Map<string, Recommendation>();

  for (const id of unique) {
    const recs = recommend(id, { limit: 16, excludeIds: unique, diversify: false });
    for (const rec of recs) {
      const existing = merged.get(rec.product.id);
      if (!existing) {
        merged.set(rec.product.id, {
          ...rec,
          reasons: [
            {
              type: "affinity",
              label: `Дополняет «${getProduct(id)?.name.split(",")[0]}»`,
              weight: 6,
            },
            ...rec.reasons,
          ],
        });
      } else {
        existing.score += rec.score * 0.45;
        existing.reasons.unshift({
          type: "affinity",
          label: `Дополняет несколько позиций корзины`,
          weight: 18,
        });
      }
    }
  }

  return [...merged.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

function coverageOf(items: Recommendation[]): RelatedResponse["coverage"] {
  if (items.length === 0) return { score: 0, label: "Нет рекомендаций" };
  const hasConsumable = items.some((item) => item.group === "consumables" || item.group === "equipment");
  const hasTogether = items.some((item) => item.group === "together" || item.group === "pinned");
  if (items.length >= 6 && hasConsumable && hasTogether) return { score: 100, label: "Полное покрытие" };
  if (items.length >= 3 && (hasConsumable || hasTogether)) return { score: 70, label: "Достаточное покрытие" };
  return { score: 40, label: "Слабое покрытие" };
}

export function relatedPayload(productId: string, options: RecommendOptions = {}): RelatedResponse {
  const items = recommend(productId, options);
  const order: Recommendation["group"][] = ["pinned", "consumables", "equipment", "together"];
  const groups: RecommendationGroup[] = order
    .map((id) => ({
      id,
      title: GROUP_TITLES[id],
      items: items.filter((item) => item.group === id),
    }))
    .filter((group) => group.items.length > 0);

  return {
    productId,
    context: options.context ?? "pdp",
    groups,
    items,
    coverage: coverageOf(items),
  };
}

export function serializeRecommendation(rec: Recommendation) {
  return {
    id: rec.product.id,
    sku: rec.product.sku,
    name: rec.product.name,
    brand: rec.product.brand,
    category: rec.product.category,
    department: rec.product.department,
    price: rec.product.price,
    unit: rec.product.unit,
    inStock: rec.product.inStock,
    score: rec.score,
    group: rec.group,
    reasons: rec.reasons.map((reason) => ({
      type: reason.type,
      label: reason.label,
    })),
    url: `/p/${rec.product.id}`,
    komusUrl: `https://www.komus.ru/p/${rec.product.id}/`,
  };
}
