import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Overrides } from "./types";

const FILE = path.join(process.cwd(), "data", "overrides.json");

const EMPTY: Overrides = { pins: {}, hidden: {} };

function ensureFile() {
  mkdirSync(path.dirname(FILE), { recursive: true });
  try {
    readFileSync(FILE, "utf8");
  } catch {
    writeFileSync(FILE, JSON.stringify(EMPTY, null, 2));
  }
}

export function readOverrides(): Overrides {
  ensureFile();
  try {
    const raw = JSON.parse(readFileSync(FILE, "utf8")) as Partial<Overrides>;
    return {
      pins: raw.pins ?? {},
      hidden: raw.hidden ?? {},
    };
  } catch {
    return { pins: {}, hidden: {} };
  }
}

export function writeOverrides(next: Overrides) {
  ensureFile();
  writeFileSync(FILE, JSON.stringify(next, null, 2));
}

export function pinRelated(productId: string, relatedId: string) {
  const data = readOverrides();
  const pins = [...(data.pins[productId] ?? []).filter((id) => id !== relatedId)];
  pins.unshift(relatedId);
  data.pins[productId] = pins;
  data.hidden[productId] = (data.hidden[productId] ?? []).filter((id) => id !== relatedId);
  writeOverrides(data);
  return data;
}

export function unpinRelated(productId: string, relatedId: string) {
  const data = readOverrides();
  data.pins[productId] = (data.pins[productId] ?? []).filter((id) => id !== relatedId);
  if (data.pins[productId].length === 0) delete data.pins[productId];
  writeOverrides(data);
  return data;
}

export function hideRelated(productId: string, relatedId: string) {
  const data = readOverrides();
  const hidden = new Set(data.hidden[productId] ?? []);
  hidden.add(relatedId);
  data.hidden[productId] = [...hidden];
  data.pins[productId] = (data.pins[productId] ?? []).filter((id) => id !== relatedId);
  writeOverrides(data);
  return data;
}

export function unhideRelated(productId: string, relatedId: string) {
  const data = readOverrides();
  data.hidden[productId] = (data.hidden[productId] ?? []).filter((id) => id !== relatedId);
  if (data.hidden[productId].length === 0) delete data.hidden[productId];
  writeOverrides(data);
  return data;
}

export function reorderPins(productId: string, relatedIds: string[]) {
  const data = readOverrides();
  data.pins[productId] = relatedIds;
  writeOverrides(data);
  return data;
}
