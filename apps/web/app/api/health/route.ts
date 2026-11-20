import { loadAccount } from "@/lib/accounts";
import { detectRuntimes } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  let account: { exists: boolean; username: string | null } = { exists: false, username: null };
  try {
    const record = await loadAccount();
    account = { exists: Boolean(record), username: record?.username ?? null };
  } catch (error) {
    return Response.json(
      {
        status: "degraded",
        error: error instanceof Error ? error.message : "account record unreadable",
      },
      { status: 503 },
    );
  }

  const runtime = await detectRuntimes();
  return Response.json({
    status: "ok",
    account,
    runtime: { recommended: runtime.recommended, platform: runtime.platform },
  });
}
