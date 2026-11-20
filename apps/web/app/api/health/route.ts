import { detectRuntimes } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const runtime = await detectRuntimes();
  return Response.json({
    status: "ok",
    auth: "better-auth",
    runtime: { recommended: runtime.recommended, platform: runtime.platform },
  });
}
