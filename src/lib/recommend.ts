import { affinityFor } from "./affinity";
import { PRODUCTS, getProduct } from "./catalog";
import { allCompatibility, compatibilityFor } from "./compatibility";
import { komusCatalogUrl } from "./format";
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

function isForeignConsumable(sourceId: string, candidateId: string): boolean {
  const links = allCompatibility(candidateId).filter(
    (row) => row.kind === "consumable" || row.kind === "spare",
  );
  if (links.length === 0) return false;
  return !links.some((row) => row.relatedId === sourceId);
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

  const foreign = isForeignConsumable(source.id, candidate.id);
  if (foreign && pinIndex < 0) {
    score -= 55;
  }

  const rule = findRule(source.category, candidate.category);
  if (rule && !foreign) {
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

  if (
    candidate.brand === source.brand &&
    candidate.category !== source.category &&
    !["Комус", "Komus"].includes(candidate.brand)
  ) {
    score += 8;
    reasons.push({ type: "brand", label: `Тот же бренд: ${source.brand}`, weight: 8 });
  }

  const keyword = keywordMatch(source, candidate);
  if (keyword && !foreign) {
    score += 36 * keyword.weight;
    reasons.push({ type: "rule", label: keyword.reason, weight: 36 * keyword.weight });
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

const HINTS: { from: RegExp; tokens: string[]; reason: string; weight: number }[] = [
  { from: /принтер|мфу|laserjet|lazern|ecotank|струйн/, tokens: ["картридж", "чернил", "тонер", "бумага", "фотобарабан"], reason: "Расходник к технике печати", weight: 1 },
  { from: /картридж|тонер|чернил/, tokens: ["бумага", "принтер", "мфу"], reason: "Бумага и техника к расходнику печати", weight: 0.7 },
  { from: /степлер/, tokens: ["скоб"], reason: "Скобы к степлеру", weight: 1 },
  { from: /дырокол/, tokens: ["папк", "регистратор", "файл"], reason: "Архив к дыроколу", weight: 0.7 },
  { from: /доска|флипчарт/, tokens: ["маркер", "губк", "магнит"], reason: "Маркеры и аксессуары к доске", weight: 1 },
  { from: /ламинатор/, tokens: ["пленк", "плёнк"], reason: "Плёнка к ламинатору", weight: 1 },
  { from: /брошюратор/, tokens: ["пружин", "обложк"], reason: "Пружины и обложки к брошюратору", weight: 1 },
  { from: /шредер|уничтожител/, tokens: ["масл"], reason: "Масло к шредеру", weight: 0.9 },
  { from: /пистолет/, tokens: ["стержн", "скотч", "этикет"], reason: "Расходник к пистолету", weight: 0.7 },
  { from: /ноутбук|noutbuk/, tokens: ["мыш", "сумк", "коврик"], reason: "Аксессуары к ноутбуку", weight: 0.8 },
  { from: /монитор/, tokens: ["кабел", "hdmi"], reason: "Кабель к монитору", weight: 0.8 },
  { from: /кресл/, tokens: ["коврик"], reason: "Коврик под кресло", weight: 0.8 },
  { from: /кофемашин|кофеварк|кофемолк/, tokens: ["кофе", "стакан", "сахар"], reason: "Кофе и посуда к кофемашине", weight: 1 },
  { from: /чайник/, tokens: ["чай", "стакан"], reason: "Чай к чайнику", weight: 0.85 },
  { from: /огнетушител/, tokens: ["подставк", "знак"], reason: "Подставка и знак к огнетушителю", weight: 0.95 },
  { from: /короб|гофро/, tokens: ["скотч", "пленк", "плёнк"], reason: "Скотч и плёнка к коробу", weight: 0.9 },
  { from: /халат|спецодежд/, tokens: ["перчат", "шкаф"], reason: "СИЗ и шкаф к спецодежде", weight: 0.55 },
  { from: /диспенсер/, tokens: ["мыло", "полотенц"], reason: "Картридж к диспенсеру", weight: 0.9 },
];

const hintPools: Product[][] = HINTS.map((hint) => {
  const pool: Product[] = [];
  for (const product of PRODUCTS) {
    const toText = `${product.name} ${product.category}`.toLowerCase();
    if (hint.tokens.some((token) => toText.includes(token))) {
      pool.push(product);
      if (pool.length >= 400) break;
    }
  }
  return pool;
});

function keywordMatch(source: Product, candidate: Product): { reason: string; weight: number } | null {
  const fromText = `${source.name} ${source.category} ${source.path ?? ""}`.toLowerCase();
  const toText = `${candidate.name} ${candidate.category}`.toLowerCase();
  for (const hint of HINTS) {
    if (!hint.from.test(fromText)) continue;
    if (hint.tokens.some((token) => toText.includes(token))) {
      return { reason: hint.reason, weight: hint.weight };
    }
  }
  return null;
}

function candidatePool(source: Product, extraIds: string[]): Product[] {
  const map = new Map<string, Product>();
  for (const row of allCompatibility(source.id)) {
    const product = getProduct(row.relatedId);
    if (product) map.set(product.id, product);
  }
  const blob = `${source.name} ${source.category} ${source.path ?? ""}`.toLowerCase();
  HINTS.forEach((hint, index) => {
    if (!hint.from.test(blob)) return;
    for (const product of hintPools[index]) {
      if (product.id !== source.id) map.set(product.id, product);
    }
  });
  for (const id of extraIds) {
    const product = getProduct(id);
    if (product) map.set(product.id, product);
  }
  return [...map.values()];
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
  const pool = candidatePool(source, pins);

  for (const candidate of pool) {
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
    path: rec.product.path ?? null,
    image: rec.product.image ?? null,
    price: rec.product.price,
    unit: rec.product.unit,
    pack: rec.product.pack ?? null,
    inStock: rec.product.inStock,
    stockQty: rec.product.stockQty,
    attributes: rec.product.attributes,
    tags: rec.product.tags,
    description: rec.product.description,
    score: rec.score,
    group: rec.group,
    reasons: rec.reasons.map((reason) => ({
      type: reason.type,
      label: reason.label,
      weight: reason.weight,
    })),
    url: `/p/${rec.product.id}`,
    workbenchUrl: `/workbench/${rec.product.id}`,
    komusUrl: komusCatalogUrl(rec.product),
  };
}
