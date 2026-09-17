import type { Compatibility } from "./types";

export const COMPATIBILITY: Compatibility[] = [
  { productId: "148201", relatedId: "148202", kind: "consumable", strength: 1, label: "Оригинальный картридж HP 107A для LaserJet 107a" },
  { productId: "148201", relatedId: "148203", kind: "consumable", strength: 0.92, label: "Совместимый картридж 107A — та же ёмкость, ниже цена" },
  { productId: "148210", relatedId: "148211", kind: "consumable", strength: 1, label: "Чернила Epson 103 Black для EcoTank L3250" },
  { productId: "148210", relatedId: "148212", kind: "consumable", strength: 1, label: "Чернила Epson 103 Cyan для EcoTank L3250" },
  { productId: "148210", relatedId: "148213", kind: "consumable", strength: 1, label: "Чернила Epson 103 Magenta для EcoTank L3250" },
  { productId: "148210", relatedId: "148214", kind: "consumable", strength: 1, label: "Чернила Epson 103 Yellow для EcoTank L3250" },
  { productId: "148220", relatedId: "148221", kind: "consumable", strength: 1, label: "Тонер TN-2375 для Brother DCP-L2520DWR" },
  { productId: "148220", relatedId: "148222", kind: "spare", strength: 0.88, label: "Фотобарабан DR-2335 — меняется каждые 4–5 тонеров" },
  { productId: "148301", relatedId: "148302", kind: "consumable", strength: 1, label: "Плёнка A4 100 мкм — основной расходник ламинатора" },
  { productId: "148301", relatedId: "148303", kind: "consumable", strength: 0.8, label: "Плёнка A4 80 мкм — для многостраничных документов" },
  { productId: "148310", relatedId: "148311", kind: "consumable", strength: 1, label: "Пружины 8 мм — до 40 листов" },
  { productId: "148310", relatedId: "148312", kind: "consumable", strength: 0.9, label: "Пружины 12 мм — до 80 листов" },
  { productId: "148310", relatedId: "148313", kind: "consumable", strength: 0.95, label: "Обложки A4 под пластиковую пружину" },
  { productId: "148320", relatedId: "148321", kind: "consumable", strength: 1, label: "Масло для режущего блока шредера" },
  { productId: "120201", relatedId: "120202", kind: "consumable", strength: 1, label: "Скобы №10 — единственный размер для этого степлера" },
  { productId: "120210", relatedId: "120211", kind: "consumable", strength: 1, label: "Скобы №23/13 для мощного степлера" },
  { productId: "120210", relatedId: "120203", kind: "consumable", strength: 0.45, label: "Скобы 24/6 подойдут только на тонкую пачку" },
  { productId: "120240", relatedId: "120241", kind: "consumable", strength: 1, label: "Сменный стержень Pilot RFJS-GP" },
  { productId: "120260", relatedId: "120251", kind: "consumable", strength: 1, label: "Набор маркеров — без них доска бесполезна" },
  { productId: "120260", relatedId: "120250", kind: "consumable", strength: 0.85, label: "Маркер чёрный — базовый цвет" },
  { productId: "120260", relatedId: "120252", kind: "accessory", strength: 0.95, label: "Губка с магнитом крепится прямо на доску" },
  { productId: "120260", relatedId: "120253", kind: "accessory", strength: 0.8, label: "Магниты для крепления распечаток" },
  { productId: "120261", relatedId: "110130", kind: "consumable", strength: 1, label: "Блок бумаги 65×100 к флипчарту 70×100" },
  { productId: "120261", relatedId: "120251", kind: "consumable", strength: 0.9, label: "Маркеры для флипчарта и доски" },
  { productId: "120271", relatedId: "120272", kind: "consumable", strength: 1, label: "Стержни 7 мм — расходник клеевого пистолета" },
  { productId: "120280", relatedId: "120281", kind: "accessory", strength: 0.9, label: "Настольный диспенсер под ленту 19 мм" },
  { productId: "180410", relatedId: "180411", kind: "accessory", strength: 1, label: "Пистолет-диспенсер под скотч 48–50 мм" },
  { productId: "180414", relatedId: "180415", kind: "accessory", strength: 0.85, label: "Этикет-пистолет для быстрой маркировки" },
  { productId: "170301", relatedId: "170302", kind: "consumable", strength: 1, label: "Картридж мыла Tork S1 — единственный совместимый" },
  { productId: "170304", relatedId: "170303", kind: "consumable", strength: 1, label: "Полотенца Tork H3 Singlefold" },
  { productId: "200601", relatedId: "200603", kind: "consumable", strength: 1, label: "Молотый кофе — капельная машина без жерновов" },
  { productId: "200601", relatedId: "200602", kind: "consumable", strength: 0.55, label: "Зёрна подойдут, если есть кофемолка" },
  { productId: "200604", relatedId: "200605", kind: "accessory", strength: 1, label: "Крышки 80 мм к стаканам 200 мл" },
  { productId: "210701", relatedId: "210702", kind: "accessory", strength: 1, label: "Напольная подставка — требование к размещению ОП-4" },
  { productId: "210701", relatedId: "210703", kind: "accessory", strength: 0.95, label: "Знак «Огнетушитель» по ГОСТ 12.4.026" },
  { productId: "150101", relatedId: "150103", kind: "accessory", strength: 0.9, label: "Сумка 15.6\" — в размер этого ноутбука" },
  { productId: "150110", relatedId: "150104", kind: "accessory", strength: 0.95, label: "HDMI-кабель для подключения монитора" },
  { productId: "160201", relatedId: "160202", kind: "accessory", strength: 0.9, label: "Коврик защищает покрытие от колёсиков кресла" },
  { productId: "160210", relatedId: "160220", kind: "accessory", strength: 0.75, label: "Подкатная тумба в ту же линейку столов" },
  { productId: "220810", relatedId: "220801", kind: "consumable", strength: 1, label: "Термоэтикетки 58 мм — ширина печати Атол BP21" },
];

const index = new Map<string, Compatibility[]>();

for (const row of COMPATIBILITY) {
  const forward = index.get(row.productId) ?? [];
  forward.push(row);
  index.set(row.productId, forward);

  const reverse: Compatibility = {
    ...row,
    productId: row.relatedId,
    relatedId: row.productId,
    label:
      row.kind === "consumable" || row.kind === "spare"
        ? `Подходит к: ${row.label}`
        : row.label,
  };
  const back = index.get(row.relatedId) ?? [];
  back.push(reverse);
  index.set(row.relatedId, back);
}

export function compatibilityFor(productId: string, relatedId: string): Compatibility | undefined {
  return index.get(productId)?.find((row) => row.relatedId === relatedId);
}

export function allCompatibility(productId: string): Compatibility[] {
  return index.get(productId) ?? [];
}
