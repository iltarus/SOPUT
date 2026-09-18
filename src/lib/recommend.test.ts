import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { recommend, recommendForCart } from "./recommend";
import { komusCatalogUrl } from "./format";
import { readOverrides, writeOverrides } from "./overrides";
import { getProduct, catalogStats } from "./catalog";
import { coverageSummary, getCoverage } from "./coverage";

const snapshot = readOverrides();

before(() => {
  writeOverrides({ pins: {}, hidden: {} });
});

after(() => {
  writeOverrides(snapshot);
});

test("лазерный принтер получает картриджи как расходники", () => {
  const recs = recommend("148201", { limit: 8 });
  assert.ok(recs.length >= 4);
  const ids = recs.map((item) => item.product.id);
  assert.ok(ids.includes("148202"), "оригинальный картридж HP 107A");
  assert.ok(ids.includes("148203"), "совместимый картридж Комус");
  assert.ok(ids.includes("110101") || ids.includes("110102"), "бумага A4");
  const toner = recs.find((item) => item.product.id === "148202");
  assert.equal(toner?.group, "consumables");
  assert.ok((toner?.score ?? 0) > 80);
});

test("степлер №10 получает скобы того же размера, а не 23/13", () => {
  const recs = recommend("120201", { limit: 8 });
  const ids = recs.map((item) => item.product.id);
  assert.ok(ids.includes("120202"));
  const staples10 = recs.find((item) => item.product.id === "120202");
  const staples23 = recs.find((item) => item.product.id === "120211");
  assert.ok(staples10);
  assert.ok(!staples23 || staples10.score > staples23.score);
});

test("скрытый товар не попадает в выдачу", () => {
  writeOverrides({ pins: {}, hidden: { "148201": ["148202"] } });
  const recs = recommend("148201", { limit: 8 });
  assert.ok(!recs.some((item) => item.product.id === "148202"));
  writeOverrides({ pins: {}, hidden: {} });
});

test("закреплённый товар стоит первым", () => {
  writeOverrides({ pins: { "148201": ["120300"] }, hidden: {} });
  const recs = recommend("148201", { limit: 8 });
  assert.equal(recs[0]?.product.id, "120300");
  assert.equal(recs[0]?.group, "pinned");
  writeOverrides({ pins: {}, hidden: {} });
});

test("корзина не рекомендует уже лежащие в ней товары", () => {
  const recs = recommendForCart(["148201", "148202", "110101"], 8);
  const ids = recs.map((item) => item.product.id);
  assert.ok(!ids.includes("148201"));
  assert.ok(!ids.includes("148202"));
  assert.ok(!ids.includes("110101"));
  assert.ok(recs.length > 0);
});

test("лазерный принтер HP не получает тонер Brother", () => {
  const recs = recommend("148201", { limit: 12, diversify: false });
  const ids = recs.map((item) => item.product.id);
  assert.ok(!ids.includes("148221"));
  assert.ok(!ids.includes("148222"));
});

test("каталог содержит карточку с указанным артикулом", () => {
  assert.equal(getProduct("210701")?.category, "Огнетушители");
});

test("ссылка на Комус для демо-id открывает поиск, а не выдуманный /p/{id}", () => {
  const product = getProduct("148201");
  assert.ok(product);
  assert.equal(product.path, undefined);
  const url = komusCatalogUrl(product);
  assert.ok(url.startsWith("https://www.komus.ru/search?text="));
  assert.equal(url.includes("/p/148201"), false);
  assert.equal(decodeURIComponent(url).includes("148201"), false);
  assert.ok(decodeURIComponent(url).includes("LaserJet"));

  const toner = getProduct("148202");
  assert.ok(toner);
  const tonerUrl = decodeURIComponent(komusCatalogUrl(toner));
  assert.ok(tonerUrl.includes("W1107A"));
});

test("полный каталог Комус загружается из sitemap", () => {
  assert.ok(catalogStats().total > 100000);
  const live = getProduct("1042218");
  assert.ok(live);
  assert.ok(live.path);
  assert.equal(komusCatalogUrl(live), "https://www.komus.ru/p/1042218/");
  assert.ok(live.name.toLowerCase().includes("принтер"));
});

test("живой степлер из sitemap получает скобы по ключевым словам", () => {
  const recs = recommend("1271903", { limit: 8 });
  assert.ok(recs.length > 0);
  assert.ok(recs.some((item) => item.product.name.toLowerCase().includes("скоб")));
});

test("письменный стол из sitemap получает кресло или канцелярию, а не пустую выдачу", () => {
  const recs = recommend("2372300", { limit: 8 });
  assert.ok(recs.length >= 3);
  const blob = recs.map((item) => `${item.product.name} ${item.product.category} ${item.product.department}`).join(" ").toLowerCase();
  assert.ok(/кресл|тумб|лотк|коврик на стол|stationery/.test(blob));
});

test("шуруповёрт получает крепёж или СИЗ", () => {
  const recs = recommend("1747684", { limit: 8 });
  assert.ok(recs.length >= 3);
  const blob = recs.map((item) => `${item.product.name} ${item.product.department}`).join(" ").toLowerCase();
  assert.ok(/бит|саморез|сверл|workwear|packaging/.test(blob));
  assert.ok(!recs.some((item) => item.product.department === "food"));
});

test("заправка картриджа не попадает в сопутку к живому принтеру", () => {
  const recs = recommend("1042218", { limit: 8 });
  assert.ok(recs.length >= 3);
  assert.ok(!recs.some((item) => /заправка|восстановлен/.test(`${item.product.name} ${item.product.category}`.toLowerCase())));
});

test("снимок покрытия считает весь каталог и пишет сопутствующие", () => {
  const summary = coverageSummary();
  assert.ok(summary.total > 100000);
  assert.equal(summary.full + summary.ok + summary.weak + summary.empty, summary.total);
  const printer = getCoverage("1042218");
  assert.ok(printer);
  assert.ok(printer.count >= 3);
  assert.ok(printer.related.length >= 3);
  const featured = getCoverage("148201");
  assert.ok(featured?.related.some((item) => item.id === "148202"));
});
