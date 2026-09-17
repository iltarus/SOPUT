import type { DepartmentId } from "./types";

export const DEPARTMENTS: {
  id: DepartmentId;
  title: string;
  komus: string;
}[] = [
  { id: "stationery", title: "Канцтовары", komus: "Канцтовары для офиса" },
  { id: "paper", title: "Бумага", komus: "Бумага, бумажные изделия" },
  { id: "print", title: "Картриджи и оргтехника", komus: "Картриджи и оргтехника" },
  { id: "computers", title: "Компьютеры", komus: "Компьютеры, аксессуары" },
  { id: "furniture", title: "Мебель", komus: "Мебель и интерьер" },
  { id: "cleaning", title: "Хозтовары", komus: "Хозтовары и профуборка" },
  { id: "packaging", title: "Упаковка и тара", komus: "Упаковка и тара" },
  { id: "workwear", title: "Спецодежда", komus: "Спецодежда и СИЗ" },
  { id: "food", title: "Продукты и кофе", komus: "Продукты питания" },
  { id: "safety", title: "Пожарная безопасность", komus: "Доски, таблички, знаки" },
  { id: "trade", title: "Товары для торговли", komus: "Товары для торговли" },
];

export function departmentTitle(id: DepartmentId): string {
  return DEPARTMENTS.find((d) => d.id === id)?.title ?? id;
}
