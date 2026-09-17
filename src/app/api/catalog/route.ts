import { catalogHandoff } from "@/lib/catalog-dump";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(catalogHandoff());
}
