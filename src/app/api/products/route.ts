import { NextRequest } from "next/server";
import { PRODUCTS, searchProducts } from "@/lib/catalog";
import { serializeProduct } from "@/lib/serialize";
import type { DepartmentId } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const department = request.nextUrl.searchParams.get("department") as DepartmentId | null;
  const category = request.nextUrl.searchParams.get("category");

  let items = q ? searchProducts(q) : PRODUCTS;
  if (department) items = items.filter((product) => product.department === department);
  if (category) items = items.filter((product) => product.category === category);

  return Response.json({
    total: items.length,
    items: items.map(serializeProduct),
  });
}
