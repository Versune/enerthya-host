import { currentOrganization } from "@/lib/current-org";
import { detectRuntimes } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await currentOrganization();
  if (!context) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }
  const report = await detectRuntimes();
  return Response.json(report);
}
