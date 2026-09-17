import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { recommend, recommendForCart } from "./recommend";
import { readOverrides, writeOverrides } from "./overrides";
import { getProduct } from "./catalog";

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
