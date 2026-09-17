# База товаров komus.ru

Снимок **всех товарных URL** из sitemap Комус. Лежит в git, его можно читать без запуска Next.js.

Передача другому агенту Cursor: [`HANDOFF.md`](./HANDOFF.md). Поиск по репо часто пропускает `*.gz` — начинайте с этого README, `komus-catalog.meta.json` или `GET http://84.201.169.67/api/catalog`.

| | |
|---|---|
| Файл | [`data/komus-catalog.json.gz`](./komus-catalog.json.gz) |
| Формат | gzip JSON-массив объектов |
| Объём | ~169 897 SKU, ~13 MB gzip / ~67 MB raw |
| Источник | `https://www.komus.ru/sitemap.xml` → `/sitemap/{0–32}.xml` |
| Цены / остатки | нет (sitemap их не отдаёт) |
| Карточка на сайте | `https://www.komus.ru/p/{id}/` |
| Картинка | поле `i`, CDN `media.komus.ru` (может быть пустым) |

Размеченный демо-срез (принтеры, степлеры, правила сопутки) — **не этот файл**, а `src/lib/catalog-featured.ts`. Приложение склеивает оба источника в `src/lib/catalog.ts`.

Снимок сопутствующих по **всем** SKU: [`komus-coverage.json.gz`](./komus-coverage.json.gz). Сборка: `npm run coverage:build`.

Метаданные снимка каталога: [`komus-catalog.meta.json`](./komus-catalog.meta.json).

## Поля строки

```json
{
  "id": "1042218",
  "n": "Принтер лазерный HP laserjet ентерприсе м507дн 1пв87а",
  "b": "HP",
  "d": "print",
  "c": "Принтеры лазерные черно белые монохромные",
  "p": "tekhnika/ofisnaya-tekhnika/printery-i-mfu/...",
  "i": "https://media.komus.ru/medias/sys_master/product-images/...jpg"
}
```

| Ключ | Смысл |
|---|---|
| `id` | Артикул Комус = id в `/p/{id}/` |
| `n` | Название (обратная транслитерация slug из sitemap) |
| `b` | Бренд (эвристика по токену) или `Комус` / `Komus` |
| `d` | Отдел: `stationery` `paper` `print` `computers` `electronics` `appliances` `furniture` `cleaning` `packaging` `workwear` `food` `kitchen` `tools` `school` `home` `beauty` `sport` `gifts` `seasonal` `safety` `trade` `other` |
| `c` | Категория (тоже из slug) |
| `p` | Путь каталога без `/katalog/` и без `/p/{id}/` |
| `i` | URL превью 200×200 или `""` |

Имена не идеальные: sitemap даёт транслит, не витринный title. Partner XML/HTML Комус антибот режет.

## Как читать другому агенту

### 1. Файл напрямую (предпочтительно)

Python:

```python
import gzip, json
from pathlib import Path

path = Path("data/komus-catalog.json.gz")
rows = json.loads(gzip.open(path, "rt", encoding="utf-8").read())
by_id = {row["id"]: row for row in rows}
print(len(rows), by_id["1042218"]["n"])
```

Node:

```js
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const rows = JSON.parse(gunzipSync(readFileSync("data/komus-catalog.json.gz")).toString("utf8"));
```

CLI из корня репозитория:

```bash
python3 scripts/query-komus-catalog.py --stats
python3 scripts/query-komus-catalog.py --id 1042218
python3 scripts/query-komus-catalog.py -q 'степлер' --limit 5
python3 scripts/query-komus-catalog.py --department print --limit 5
```

Не разжимайте весь gzip в git: держите `.json.gz`.

### 2. HTTP API сервиса Сопут

Если приложение запущено (`npm run dev` / `npm start`, порт **43127**):

```
GET /api/products?q=&department=&offset=0&limit=48
GET /api/products/{id}
GET /api/products/{id}/related
```

Публично:

```
GET http://84.201.169.67/api/catalog
GET http://84.201.169.67/api/catalog/dump          # gzip, ~13 MB
GET http://84.201.169.67/api/catalog/coverage      # gzip сопутки
GET http://84.201.169.67/api/products?q=степлер&limit=5
```

Ответ уже гидратирован (name, brand, image, komusUrl). Это **не** сырой массив из gzip: сверху накладывается featured-срез.

### 3. Код приложения

```ts
import { getProduct, queryProducts, catalogStats } from "@/lib/catalog";
```

Модуль серверный (`fs` + gzip). Не импортировать из клиентских компонентов.

## Пересборка снимка

Нужны sitemap XML в `/tmp/komus-sitemaps/{0..32}.xml` (с cookie/UA, иначе Комус отдаёт 503):

```bash
npm run catalog:build
# scripts/build-komus-catalog.py → data/komus-catalog.json.gz
```
