import { NextRequest } from "next/server";
import { COVERAGE_LABELS, coverageSummary, getCoverage, queryCoverage, serializeCoverageRow } from "@/lib/coverage";
import type { CoverageLabel } from "@/lib/coverage-label";
import type { DepartmentId } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = params.get("id");
  if (id) {
    const row = getCoverage(id);
    if (!row) return Response.json({ error: "Нет снимка покрытия" }, { status: 404 });
    return Response.json({ summary: coverageSummary(), item: serializeCoverageRow(row) });
  }

  const label = (params.get("label") ?? "") as CoverageLabel | "";
  const department = (params.get("department") ?? "") as DepartmentId | "";
  const result = queryCoverage({
    q: params.get("q") ?? "",
    department: department || undefined,
    label: label && (COVERAGE_LABELS as readonly string[]).includes(label) ? label : undefined,
    offset: Number(params.get("offset") ?? 0),
    limit: Number(params.get("limit") ?? 50),
  });

  return Response.json({
    summary: coverageSummary(),
    total: result.total,
    offset: result.offset,
    items: result.items.map(serializeCoverageRow),
  });
}
