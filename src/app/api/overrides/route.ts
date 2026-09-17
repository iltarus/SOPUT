import { hideRelated, pinRelated, readOverrides, unhideRelated, unpinRelated } from "@/lib/overrides";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(readOverrides());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    productId?: string;
    relatedId?: string;
    action?: "pin" | "unpin" | "hide" | "unhide";
  } | null;

  if (!body?.productId || !body.relatedId || !body.action) {
    return Response.json({ error: "Нужны productId, relatedId и action" }, { status: 400 });
  }

  const actions = { pin: pinRelated, unpin: unpinRelated, hide: hideRelated, unhide: unhideRelated };
  const data = actions[body.action](body.productId, body.relatedId);
  return Response.json(data);
}
