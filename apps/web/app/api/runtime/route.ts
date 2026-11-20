import { detectRuntimes } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await detectRuntimes();
  return Response.json(report);
}
