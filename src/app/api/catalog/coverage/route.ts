import { streamGzipDump } from "@/lib/catalog-dump";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return streamGzipDump("komus-coverage.json.gz", "komus-coverage.json.gz");
}
