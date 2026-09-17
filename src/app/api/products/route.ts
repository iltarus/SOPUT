import { NextRequest } from "next/server";
import { queryProducts } from "@/lib/catalog";
import { serializeProduct } from "@/lib/serialize";
import type { DepartmentId } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get("q") ?? "";
  const department = (params.get("department") ?? "") as DepartmentId | "";
  const category = params.get("category") ?? "";
  const offset = Number(params.get("offset") ?? 0);
  const limit = Number(params.get("limit") ?? 48);

  const result = queryProducts({
    q,
    department: department || undefined,
    category: category || undefined,
    offset: Number.isFinite(offset) ? offset : 0,
    limit: Number.isFinite(limit) ? limit : 48,
  });

  return Response.json({
    total: result.total,
    offset: result.offset,
    items: result.items.map(serializeProduct),
  });
}
