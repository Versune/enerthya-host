import { handlePush } from "@/lib/webhooks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GitHub push webhook. There is no session here: the HMAC of the raw body,
 * computed with the application's own secret, is the credential.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  try {
    const outcome = await handlePush(id, rawBody, signature);
    if (outcome === "unknown")
      return Response.json({ error: "Unknown application" }, { status: 404 });
    if (outcome === "forbidden") {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
    if (outcome.status === "ignored") {
      return Response.json({ ignored: outcome.reason }, { status: 202 });
    }
    return Response.json({ queued: outcome.deploymentId }, { status: 202 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The queue is unreachable." },
      { status: 503 },
    );
  }
}
