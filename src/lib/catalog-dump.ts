import { createReadStream, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

export const PUBLIC_BASE = "http://84.201.169.67";

export function catalogDataFile(name: string) {
  return path.join(process.cwd(), "data", name);
}

export function streamGzipDump(filename: string, downloadName: string) {
  const file = catalogDataFile(filename);
  if (!existsSync(file)) {
    return new Response(JSON.stringify({ error: "dump missing", file: filename }), {
      status: 404,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export function catalogHandoff() {
  const meta = JSON.parse(readFileSync(catalogDataFile("komus-catalog.meta.json"), "utf8")) as {
    count: number;
    file: string;
    fields: Record<string, string>;
  };
  return {
    what: "Полный дамп товаров komus.ru. Не скрейпить витрину. Glob/Grep часто не видят .gz — читать этот JSON или data/HANDOFF.md.",
    gitFile: "data/komus-catalog.json.gz",
    metaFile: "data/komus-catalog.meta.json",
    readme: "data/README.md",
    handoff: "data/HANDOFF.md",
    sample: "data/komus-catalog.sample.json",
    cli: "python3 scripts/query-komus-catalog.py --stats",
    count: meta.count,
    fields: meta.fields,
    download: "/api/catalog/dump",
    downloadUrl: `${PUBLIC_BASE}/api/catalog/dump`,
    locatorUrl: `${PUBLIC_BASE}/api/catalog`,
    coverageDump: "/api/catalog/coverage",
    coverageUrl: `${PUBLIC_BASE}/api/catalog/coverage`,
    searchApi: `${PUBLIC_BASE}/api/products?q=&limit=5`,
    doNotScrape: "https://www.komus.ru/",
    doNotLookIn: ["/tmp/komus-sitemaps", "HTML PDP", "partner XML"],
  };
}
