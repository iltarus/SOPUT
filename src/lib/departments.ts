import type { DepartmentId } from "./types";

export const DEPARTMENTS: {
  id: DepartmentId;
  title: string;
  komus: string;
}[] = [
  { id: "stationery", title: "Канцтовары", komus: "Канцтовары, ручки, папки" },
  { id: "paper", title: "Бумага", komus: "Бумага и бумажные изделия" },
  { id: "print", title: "Картриджи и оргтехника", komus: "Картриджи и оргтехника" },
  { id: "computers", title: "Компьютеры", komus: "Компьютеры и периферия" },
  { id: "electronics", title: "Электроника", komus: "ТВ, аудио, видео, СКУД" },
  { id: "appliances", title: "Бытовая техника", komus: "Бытовая и профессиональная техника" },
  { id: "furniture", title: "Мебель", komus: "Мебель и интерьер" },
  { id: "cleaning", title: "Хозтовары", komus: "Хозтовары и профуборка" },
  { id: "packaging", title: "Упаковка и тара", komus: "Упаковка, маркировка, тара" },
  { id: "workwear", title: "Спецодежда", komus: "Спецодежда и СИЗ" },
  { id: "food", title: "Продукты и кофе", komus: "Продукты питания" },
  { id: "kitchen", title: "Посуда и текстиль", komus: "Посуда и текстиль" },
  { id: "tools", title: "Инструменты", komus: "Инструменты и электрика" },
  { id: "school", title: "Учёба и творчество", komus: "Товары для учёбы и творчества" },
  { id: "home", title: "Дом и дача", komus: "Для дома, дачи и озеленения" },
  { id: "beauty", title: "Красота и здоровье", komus: "Красота, гигиена" },
  { id: "sport", title: "Спорт и отдых", komus: "Спорт, пикник, отдых" },
  { id: "gifts", title: "Подарки", komus: "Подарки и сувениры" },
  { id: "seasonal", title: "Новый год", komus: "Новогодние товары" },
  { id: "safety", title: "Пожарная безопасность", komus: "Доски, таблички, знаки" },
  { id: "trade", title: "Для торговли", komus: "Товары для торговли и отрасли" },
  { id: "other", title: "Прочее", komus: "Прочее" },
];

export function departmentTitle(id: DepartmentId): string {
  return DEPARTMENTS.find((d) => d.id === id)?.title ?? id;
}
