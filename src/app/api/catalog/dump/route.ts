import { streamGzipDump } from "@/lib/catalog-dump";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return streamGzipDump("komus-catalog.json.gz", "komus-catalog.json.gz");
}
