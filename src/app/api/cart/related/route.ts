import { recommendForCart, serializeRecommendation } from "@/lib/recommend";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { ids?: string[]; limit?: number } | null;
  const ids = body?.ids ?? [];
  if (!Array.isArray(ids) || ids.length === 0) {
    return Response.json({ items: [], message: "Корзина пуста" });
  }

  const limit = Math.min(Math.max(body?.limit ?? 10, 1), 24);
  const items = recommendForCart(ids, limit).map(serializeRecommendation);
  return Response.json({ items, count: items.length });
}
