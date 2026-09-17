import { affinityFor } from "./affinity";
import { collectByDepartment, collectByText, getProduct } from "./catalog";
import type {
  DepartmentId,
  Product,
  Reason,
  RecommendOptions,
  Recommendation,
  RecommendationGroup,
  RelatedResponse,
} from "./types";
import { allCompatibility, compatibilityFor } from "./compatibility";
import { komusCatalogUrl } from "./format";
import { readOverrides } from "./overrides";
import { findRule } from "./rules";

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

  const dept = departmentLink(source, candidate);
  if (dept) {
    const weight = 32 * dept.weight;
    score += weight;
    reasons.push({ type: "rule", label: dept.reason, weight });
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

function isServiceSku(name: string, category: string, path = ""): boolean {
  const text = `${name} ${category} ${path}`.toLowerCase();
  return /заправка|восстановлен|ремонт|ауцорс|обслуживание|nashi-uslugi/.test(text);
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
  { from: /смартфон|планшет/, tokens: ["чехол", "зарядн", "кабел"], reason: "Чехол и зарядка к устройству", weight: 0.85 },
  { from: /мыш/, tokens: ["коврик"], reason: "Коврик к мыши", weight: 0.75 },
  { from: /телевизор/, tokens: ["кабел", "кронштейн"], reason: "Кабель и кронштейн к телевизору", weight: 0.8 },
  { from: /наушник/, tokens: ["кабел", "чехол"], reason: "Аксессуар к наушникам", weight: 0.55 },
  { from: /стол|писмен/, tokens: ["кресл", "тумб", "коврик", "ламп", "лотк"], reason: "Кресло, тумба и органайзер к столу", weight: 0.9 },
  { from: /кресл|стул/, tokens: ["коврик", "тумб"], reason: "Коврик и тумба к креслу", weight: 0.8 },
  { from: /шкаф/, tokens: ["папк", "вешал", "короб"], reason: "Хранение к шкафу", weight: 0.7 },
  { from: /стеллаж/, tokens: ["короб", "контейнер", "лотк"], reason: "Короба и лотки к стеллажу", weight: 0.75 },
  { from: /тумб/, tokens: ["лотк", "органайзер"], reason: "Лоток к тумбе", weight: 0.65 },
  { from: /диван|банкет/, tokens: ["подушк", "плед"], reason: "Текстиль к мягкой мебели", weight: 0.7 },
  { from: /шуруповерт|дрел|дрель/, tokens: ["бит", "саморез", "сверл", "аккумулятор"], reason: "Биты и крепёж к шуруповёрту", weight: 0.9 },
  { from: /шлифмашин|болгарк/, tokens: ["диск", "круг"], reason: "Круги к шлифмашине", weight: 0.9 },
  { from: /кист|валик|маляр/, tokens: ["лент", "ванночк", "скотч"], reason: "Расходник к малярным работам", weight: 0.65 },
  { from: /светилник|светильник|ламп/, tokens: ["ламп", "патрон"], reason: "Лампа к светильнику", weight: 0.7 },
  { from: /саморез|шуруп/, tokens: ["шуруповерт", "бит"], reason: "Инструмент к крепежу", weight: 0.6 },
  { from: /костюм|куртк|брюк|халат|спецодежд/, tokens: ["перчат", "каск", "ботин", "носк"], reason: "СИЗ к спецодежде", weight: 0.7 },
  { from: /ботинк|сапог|полуботин/, tokens: ["носк", "стельк", "крем"], reason: "Носки и уход к обуви", weight: 0.7 },
  { from: /холодильник|холодилник/, tokens: ["контейнер", "пакет"], reason: "Контейнеры к холодильнику", weight: 0.65 },
  { from: /сплит/, tokens: ["фильтр"], reason: "Фильтр к сплит-системе", weight: 0.75 },
  { from: /кулер/, tokens: ["вода", "стакан"], reason: "Вода и посуда к кулеру", weight: 1 },
  { from: /стирал/, tokens: ["порошок", "кондиционер"], reason: "Бытовая химия к стиральной машине", weight: 0.9 },
  { from: /кофемашин|кофеварк|кофемолк/, tokens: ["кофе", "стакан", "сахар"], reason: "Кофе и посуда к кофемашине", weight: 1 },
  { from: /чайник/, tokens: ["чай", "стакан"], reason: "Чай к чайнику", weight: 0.85 },
  { from: /огнетушител/, tokens: ["подставк", "знак"], reason: "Подставка и знак к огнетушителю", weight: 0.95 },
  { from: /короб|гофро/, tokens: ["скотч", "пленк", "плёнк"], reason: "Скотч и плёнка к коробу", weight: 0.9 },
  { from: /скотч|клейк/, tokens: ["диспенсер", "нож", "короб"], reason: "Диспенсер и короб к скотчу", weight: 0.75 },
  { from: /халат|спецодежд/, tokens: ["перчат", "шкаф"], reason: "СИЗ и шкаф к спецодежде", weight: 0.55 },
  { from: /диспенсер/, tokens: ["мыло", "полотенц"], reason: "Картридж к диспенсеру", weight: 0.9 },
  { from: /швабр|моп/, tokens: ["моп", "ведро", "насадк"], reason: "Насадка и ведро к швабре", weight: 0.9 },
  { from: /мешк для мусор|бак для мусор|контейнер.{0,12}мусор/, tokens: ["мешк", "бак"], reason: "Мешки и бак в комплект уборки", weight: 0.8 },
  { from: /тетрад|пенал|ранец/, tokens: ["ручк", "карандаш", "тетрад", "пенал"], reason: "Канцелярия к учёбе", weight: 0.7 },
  { from: /елк|елочн|гирлянд/, tokens: ["игрушк", "гирлянд", "мишур"], reason: "Игрушки и гирлянды к ёлке", weight: 0.85 },
  { from: /шампунь|гель для душа/, tokens: ["балзам", "мочал", "полотенц"], reason: "Уход в комплект к гигиене", weight: 0.55 },
];

const hintPools: Product[][] = HINTS.map((hint) =>
  collectByText((name, category, _id, path) => {
    if (isServiceSku(name, category, path)) return false;
    const toText = `${name} ${category}`.toLowerCase();
    return hint.tokens.some((token) => toText.includes(token));
  }, 250),
);

const DEPT_COMPLEMENT: Record<DepartmentId, { department: DepartmentId; reason: string; weight: number }[]> = {
  furniture: [
    { department: "cleaning", reason: "Хозтовары к мебели и рабочему месту", weight: 0.45 },
    { department: "stationery", reason: "Канцелярия к офисной мебели", weight: 0.4 },
  ],
  print: [{ department: "paper", reason: "Бумага к оргтехнике и расходникам печати", weight: 0.5 }],
  tools: [
    { department: "workwear", reason: "СИЗ к инструменту", weight: 0.45 },
    { department: "packaging", reason: "Крепёж и расходники рядом с инструментом", weight: 0.35 },
  ],
  computers: [
    { department: "electronics", reason: "Кабели и периферия к компьютеру", weight: 0.45 },
    { department: "stationery", reason: "Организация рабочего места", weight: 0.35 },
  ],
  workwear: [
    { department: "cleaning", reason: "Уход и расходники к спецодежде", weight: 0.4 },
    { department: "safety", reason: "Охрана труда к СИЗ", weight: 0.45 },
  ],
  appliances: [
    { department: "kitchen", reason: "Посуда к бытовой технике", weight: 0.5 },
    { department: "food", reason: "Продукты к кухонной технике", weight: 0.45 },
    { department: "cleaning", reason: "Уход за техникой", weight: 0.35 },
  ],
  trade: [
    { department: "packaging", reason: "Упаковка к торговому оборудованию", weight: 0.45 },
    { department: "workwear", reason: "Форма к рабочему месту", weight: 0.35 },
  ],
  cleaning: [
    { department: "workwear", reason: "СИЗ к уборке", weight: 0.45 },
    { department: "packaging", reason: "Мешки и тара к клинингу", weight: 0.4 },
  ],
  food: [{ department: "kitchen", reason: "Посуда и расходники к продуктам", weight: 0.55 }],
  stationery: [{ department: "paper", reason: "Бумага к канцелярии", weight: 0.5 }],
  kitchen: [
    { department: "food", reason: "Продукты к посуде", weight: 0.45 },
    { department: "cleaning", reason: "Моющие к кухне", weight: 0.4 },
  ],
  electronics: [
    { department: "computers", reason: "Периферия к электронике", weight: 0.4 },
    { department: "tools", reason: "Кабель и крепёж к технике", weight: 0.35 },
  ],
  school: [
    { department: "stationery", reason: "Канцелярия к учёбе", weight: 0.55 },
    { department: "paper", reason: "Тетради и бумага к школе", weight: 0.5 },
  ],
  paper: [{ department: "stationery", reason: "Степлер и архив к бумаге", weight: 0.45 }],
  home: [
    { department: "cleaning", reason: "Уход за домом", weight: 0.45 },
    { department: "kitchen", reason: "Текстиль и посуда к дому", weight: 0.35 },
  ],
  gifts: [{ department: "packaging", reason: "Упаковка к подарку", weight: 0.55 }],
  sport: [
    { department: "kitchen", reason: "Бутылка и текстиль к спорту", weight: 0.4 },
    { department: "home", reason: "Сумка к тренировке", weight: 0.35 },
  ],
  packaging: [
    { department: "tools", reason: "Нож и пистолет к упаковке", weight: 0.45 },
    { department: "stationery", reason: "Маркировка к коробу", weight: 0.35 },
  ],
  seasonal: [
    { department: "gifts", reason: "Подарки к ёлке", weight: 0.5 },
    { department: "packaging", reason: "Упаковка к новогодним наборам", weight: 0.4 },
  ],
  beauty: [{ department: "cleaning", reason: "Салфетки и расходники к гигиене", weight: 0.4 }],
  safety: [
    { department: "workwear", reason: "СИЗ к пожарной безопасности", weight: 0.45 },
    { department: "furniture", reason: "Шкаф и подставка к знакам", weight: 0.4 },
  ],
  other: [{ department: "print", reason: "Расходники к сервису техники", weight: 0.3 }],
};

const deptPools: Record<DepartmentId, Product[]> = Object.fromEntries(
  (Object.keys(DEPT_COMPLEMENT) as DepartmentId[]).map((id) => [
    id,
    collectByDepartment(id, 90).filter((product) => !isServiceSku(product.name, product.category, product.path)),
  ]),
) as Record<DepartmentId, Product[]>;

function departmentLink(source: Product, candidate: Product): { reason: string; weight: number } | null {
  if (candidate.department === source.department) return null;
  const links = DEPT_COMPLEMENT[source.department] ?? [];
  const hit = links.find((link) => link.department === candidate.department);
  return hit ?? null;
}

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
  for (const link of DEPT_COMPLEMENT[source.department] ?? []) {
    for (const product of deptPools[link.department] ?? []) {
      if (product.id !== source.id) map.set(product.id, product);
    }
  }
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
    if (isServiceSku(candidate.name, candidate.category, candidate.path)) continue;
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
