import { coverageRows, coverageSummary } from "@/lib/coverage";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    summary: coverageSummary(),
    items: coverageRows(),
  });
}
