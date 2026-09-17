# База товаров Комус — передача другому агенту Cursor

Поиск по репозиторию **не находит** `*.gz`: это бинарный gzip, Glob/Grep его пропускают. Каталог уже скачан и лежит здесь.

| Что | Где |
|---|---|
| Полный дамп SKU | `data/komus-catalog.json.gz` (~169 897 строк, ~13 MB) |
| Метаданные (этот файл Grep видит) | `data/komus-catalog.meta.json` |
| Пример двух карточек | `data/komus-catalog.sample.json` |
| Контракт полей | `data/README.md` |
| Сопутка по всем SKU | `data/komus-coverage.json.gz` |
| CLI | `python3 scripts/query-komus-catalog.py --stats` |

**Не скрейпить komus.ru. Не искать XML в `/tmp/komus-sitemaps`** — это локальный кэш другой машины.

## Если агент в ЭТОМ репозитории, ветка `main`

```bash
git pull origin main
ls -lh data/komus-catalog.json.gz data/komus-catalog.meta.json
python3 scripts/query-komus-catalog.py --stats
python3 scripts/query-komus-catalog.py --id 1042218
```

## Если агент в другом проекте / воркспейсе

Скачать готовый gzip (не HTML):

```bash
curl -fsSL -o komus-catalog.json.gz http://84.201.169.67/api/catalog/dump
curl -fsSL http://84.201.169.67/api/catalog
python3 -c "import gzip,json; r=json.loads(gzip.open('komus-catalog.json.gz','rt',encoding='utf-8').read()); print(len(r), r[0])"
```

Поиск без файла:

```
GET http://84.201.169.67/api/products?q=степлер&limit=5
GET http://84.201.169.67/api/products/1042218
```

## Промпт, который можно вставить соседнему агенту

```
Каталог товаров Комус уже собран. Не парси komus.ru и не ищи sitemap на диске.

1) В этом репозитории (ветка main): data/komus-catalog.json.gz
   Как читать: data/README.md и data/HANDOFF.md
   Grep не видит .gz — смотри data/komus-catalog.meta.json
   CLI: python3 scripts/query-komus-catalog.py --stats
2) Если файла нет: curl -fsSL -o data/komus-catalog.json.gz http://84.201.169.67/api/catalog/dump
   Локатор: GET http://84.201.169.67/api/catalog
3) Формат строки: {id, n, b, d, c, p, i}. Карточка https://www.komus.ru/p/{id}/
   Имена из обратной транслитерации slug sitemap, цен нет.
```
