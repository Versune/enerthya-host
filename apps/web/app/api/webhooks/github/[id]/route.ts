import { handlePush } from "@/lib/webhooks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GitHub push payloads are far smaller than this; anything larger is not ours. */
const MAX_BODY_BYTES = 1024 * 1024;

/**
 * Reads the raw body with a hard cap. Content-Length is only a hint — it can be
 * missing or wrong — so the stream itself is bounded and the reader is cancelled
 * as soon as the cap is crossed. Returns null when the body is too large.
 */
async function readBodyCapped(request: Request, limit: number): Promise<string | null> {
  const declared = request.headers.get("content-length");
  if (declared !== null && Number(declared) > limit) return null;
  if (!request.body) return "";

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let body = "";
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel().catch(() => undefined);
        return null;
      }
      body += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
  return body + decoder.decode();
}

/**
 * GitHub push webhook. There is no session here: the HMAC of the raw body,
 * computed with the application's own secret, is the credential.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawBody = await readBodyCapped(request, MAX_BODY_BYTES);
  if (rawBody === null) {
    return Response.json({ error: "Payload too large" }, { status: 413 });
  }
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
