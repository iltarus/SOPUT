import { getProduct } from "@/lib/catalog";
import { relatedPayload, serializeRecommendation } from "@/lib/recommend";
import { serializeProduct } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const product = getProduct(id);
  if (!product) {
    return Response.json({ error: "Товар не найден" }, { status: 404 });
  }

  const related = relatedPayload(id, { limit: 8, context: "pdp" });

  return Response.json({
    product: serializeProduct(product),
    related: {
      ...related,
      items: related.items.map(serializeRecommendation),
      groups: related.groups.map((group) => ({
        ...group,
        items: group.items.map(serializeRecommendation),
      })),
    },
  });
}
