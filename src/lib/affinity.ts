type BasketTemplate = {
  items: string[];
  n: number;
};

const TEMPLATES: BasketTemplate[] = [
  { items: ["148201", "148202", "110101"], n: 42 },
  { items: ["148201", "148203", "110102"], n: 31 },
  { items: ["148201", "148202", "110103", "120201"], n: 8 },
  { items: ["148210", "148211", "148212", "148213", "148214", "110101"], n: 27 },
  { items: ["148210", "148211", "110120"], n: 9 },
  { items: ["148220", "148221", "148222", "110102"], n: 18 },
  { items: ["148301", "148302", "110101"], n: 16 },
  { items: ["148310", "148311", "148313", "110101"], n: 12 },
  { items: ["148320", "148321"], n: 11 },
  { items: ["120201", "120202", "110101"], n: 36 },
  { items: ["120210", "120211", "110102", "120230"], n: 10 },
  { items: ["120230", "120232", "120220"], n: 22 },
  { items: ["120240", "120241", "120310"], n: 14 },
  { items: ["120260", "120251", "120252", "120253"], n: 19 },
  { items: ["120261", "110130", "120251"], n: 13 },
  { items: ["120271", "120272"], n: 15 },
  { items: ["120280", "120281"], n: 17 },
  { items: ["150101", "150102", "150103", "150106"], n: 14 },
  { items: ["150110", "150104", "150102"], n: 11 },
  { items: ["160201", "160202", "160210"], n: 9 },
  { items: ["160210", "160220", "160201"], n: 7 },
  { items: ["170301", "170302", "170304", "170303"], n: 21 },
  { items: ["170311", "170310"], n: 14 },
  { items: ["180401", "180410", "180411", "180413"], n: 24 },
  { items: ["180402", "180410", "180414"], n: 16 },
  { items: ["180412", "180413", "180401"], n: 10 },
  { items: ["190501", "190502", "190503"], n: 8 },
  { items: ["200601", "200603", "200604", "200605", "200606"], n: 20 },
  { items: ["200610", "200607", "200604", "200608"], n: 15 },
  { items: ["200602", "200604", "200606"], n: 12 },
  { items: ["210701", "210702", "210703"], n: 18 },
  { items: ["210701", "210704", "210703"], n: 6 },
  { items: ["220810", "220801", "180414"], n: 13 },
  { items: ["220802", "220803"], n: 9 },
  { items: ["110101", "120201", "120232", "120240"], n: 19 },
];

export type AffinityPair = {
  count: number;
  lift: number;
};

export type AffinityIndex = Record<string, Record<string, AffinityPair>>;

function buildAffinity(): AffinityIndex {
  const pairCount = new Map<string, number>();
  const itemCount = new Map<string, number>();
  let orders = 0;

  for (const template of TEMPLATES) {
    for (let i = 0; i < template.n; i += 1) {
      orders += 1;
      const unique = [...new Set(template.items)];
      for (const id of unique) {
        itemCount.set(id, (itemCount.get(id) ?? 0) + 1);
      }
      for (let a = 0; a < unique.length; a += 1) {
        for (let b = a + 1; b < unique.length; b += 1) {
          const key = [unique[a], unique[b]].sort().join("|");
          pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
        }
      }
    }
  }

  const index: AffinityIndex = {};

  for (const [key, count] of pairCount) {
    const [a, b] = key.split("|");
    const pa = (itemCount.get(a) ?? 0) / orders;
    const pb = (itemCount.get(b) ?? 0) / orders;
    const pab = count / orders;
    const lift = pa > 0 && pb > 0 ? pab / (pa * pb) : 0;
    if (!index[a]) index[a] = {};
    if (!index[b]) index[b] = {};
    index[a][b] = { count, lift };
    index[b][a] = { count, lift };
  }

  return index;
}

export const AFFINITY = buildAffinity();

export function affinityFor(a: string, b: string): AffinityPair | undefined {
  return AFFINITY[a]?.[b];
}

export const ORDER_VOLUME = TEMPLATES.reduce((sum, template) => sum + template.n, 0);
