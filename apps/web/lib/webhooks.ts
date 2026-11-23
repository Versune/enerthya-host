import { randomUUID } from "node:crypto";
import { enqueueDeployment } from "@enerthya/core/queue";
import { verifyGithubSignature } from "@enerthya/core/webhook";
import { getDb, insertDeployment, selectDeployHook, transitionDeployment } from "@enerthya/db";
import { webhookSecretFor } from "@/lib/applications";

export type PushOutcome =
  | { status: "queued"; deploymentId: string }
  | { status: "ignored"; reason: string };

/**
 * A push on the branch the application deploys queues a deployment. The
 * signature is verified against the application's own secret, so a caller
 * cannot deploy someone else's application, and `autoDeploy` is honoured.
 */
export async function handlePush(
  applicationId: string,
  rawBody: string,
  signature: string | null,
): Promise<PushOutcome | "unknown" | "forbidden"> {
  const db = getDb();
  const hook = await selectDeployHook(db, applicationId);
  if (!hook) return "unknown";
  if (!hook.autoDeploy)
    return { status: "ignored", reason: "Auto-deploy is disabled for this application." };
  const secret = await webhookSecretFor(hook);
  if (!secret) return "forbidden";
  if (!verifyGithubSignature(secret, rawBody, signature)) return "forbidden";

  let payload: { ref?: string; after?: string };
  try {
    payload = JSON.parse(rawBody) as { ref?: string; after?: string };
  } catch {
    return { status: "ignored", reason: "The payload was not JSON." };
  }

  const expectedRef = `refs/heads/${hook.gitBranch}`;
  if (payload.ref !== expectedRef) {
    return {
      status: "ignored",
      reason: `The push was to ${payload.ref ?? "an unknown ref"}; this application deploys ${expectedRef}.`,
    };
  }

  const id = randomUUID();
  await insertDeployment(db, { id, applicationId });

  const redisUrl = process.env.REDIS_URL;
  try {
    if (!redisUrl) throw new Error("REDIS_URL is not set in the panel's environment.");
    await enqueueDeployment(redisUrl, id);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "The queue is unreachable.";
    await transitionDeployment(db, id, ["queued"], "failed", {
      error: `The deployment could not be queued: ${reason}`,
      finishedAt: new Date(),
    });
    throw new Error(reason);
  }

  return { status: "queued", deploymentId: id };
}
