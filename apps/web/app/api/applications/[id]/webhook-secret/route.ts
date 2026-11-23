import { rotateWebhookSecret } from "@/lib/applications";
import { requireAdmin } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

/** Replaces the secret the webhook signature is checked against. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin("rotate the webhook secret");
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const secret = await rotateWebhookSecret(gate.context.organization.id, id);
  if (!secret) return Response.json({ error: "Application not found" }, { status: 404 });

  return Response.json({ webhookSecret: secret });
}
