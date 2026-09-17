import { RULES } from "@/lib/rules";

export async function GET() {
  return Response.json({ total: RULES.length, items: RULES });
}
