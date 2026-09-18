import { gzipSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { eachCatalogMeta } from "../src/lib/catalog";
import { coverageLabel, type CoverageRow, type CoverageSummary } from "../src/lib/coverage-label";
import { recommend } from "../src/lib/recommend";

const OUT = path.join(process.cwd(), "data", "komus-coverage.json.gz");
const META = path.join(process.cwd(), "data", "komus-coverage.meta.json");
const limitArg = Number(process.env.COVERAGE_LIMIT ?? 0);

function main() {
  const items: CoverageRow[] = [];
  let full = 0;
  let ok = 0;
  let weak = 0;
  let empty = 0;
  const started = Date.now();
  let index = 0;

  eachCatalogMeta((meta) => {
    if (limitArg && items.length >= limitArg) return false;
    index += 1;
    const recs = recommend(meta.id, { limit: 8 });
    const label = coverageLabel(recs.length);
    if (label === "Полное") full += 1;
    else if (label === "Достаточное") ok += 1;
    else if (label === "Слабое") weak += 1;
    else empty += 1;
    items.push({
      id: meta.id,
      name: meta.name.slice(0, 120),
      category: meta.category,
      department: meta.department,
      count: recs.length,
      score: recs[0]?.score ?? 0,
      label,
      related: recs.map((rec) => ({
        id: rec.product.id,
        score: rec.score,
        group: rec.group,
      })),
    });
    if (index % 2000 === 0) {
      const elapsed = (Date.now() - started) / 1000;
      const rate = index / elapsed;
      process.stderr.write(
        `${index} ${elapsed.toFixed(1)}s ${rate.toFixed(0)}/s full=${full} ok=${ok} weak=${weak} empty=${empty}\n`,
      );
    }
  });

  items.sort((a, b) => a.count - b.count || a.score - b.score);
  const total = items.length;
  const summary: CoverageSummary = {
    total,
    featured: total,
    full,
    ok,
    weak,
    empty,
    coveragePct: total ? Math.round(((full + ok) / total) * 100) : 0,
    builtAt: new Date().toISOString(),
  };

  writeFileSync(OUT, gzipSync(Buffer.from(JSON.stringify({ builtAt: summary.builtAt, summary, items })), { level: 9 }));
  const ndjson = path.join(process.cwd(), "data", "komus-coverage.ndjson.gz");
  writeFileSync(
    ndjson,
    gzipSync(Buffer.from(items.map((row) => JSON.stringify(row)).join("\n") + "\n"), { level: 9 }),
  );
  writeFileSync(META, JSON.stringify(summary, null, 2) + "\n");
  process.stderr.write(`wrote ${OUT}, ${ndjson} and ${META} total=${total} coverage=${summary.coveragePct}%\n`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
