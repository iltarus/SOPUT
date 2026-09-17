import { NextRequest } from "next/server";
import { getProduct } from "@/lib/catalog";
import { relatedPayload, serializeRecommendation } from "@/lib/recommend";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!getProduct(id)) {
    return Response.json({ error: "Товар не найден" }, { status: 404 });
  }

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 12);
  const contextName = request.nextUrl.searchParams.get("context") === "cart" ? "cart" : "pdp";
  const related = relatedPayload(id, {
    limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 24) : 12,
    context: contextName,
  });

  return Response.json({
    productId: id,
    context: related.context,
    coverage: related.coverage,
    groups: related.groups.map((group) => ({
      id: group.id,
      title: group.title,
      items: group.items.map(serializeRecommendation),
    })),
    items: related.items.map(serializeRecommendation),
  });
}
