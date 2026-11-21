import { decryptSecret } from "@enerthya/core/crypto";
import { getDb, selectDeliveryTargets } from "@enerthya/db";

export type FailureNotice = {
  applicationName: string;
  applicationId: string;
  deploymentId: string;
  error: string;
};

/** The message both channel types carry; Discord shows it verbatim. */
export function formatNotice(notice: FailureNotice): string {
  return [
    `Deployment failed: ${notice.applicationName}`,
    notice.error,
    `deployment ${notice.deploymentId.slice(0, 8)}`,
  ].join("\n");
}

/**
 * Sends `deployment.failed` to every enabled channel of the application's
 * organization that subscribed to it. A channel that refuses is logged and
 * skipped: one bad webhook must not stop the others, and never the deployment.
 */
export async function notifyFailure(applicationId: string, notice: FailureNotice): Promise<void> {
  const targets = await selectDeliveryTargets(getDb(), applicationId, "deployment.failed").catch(
    () => [],
  );

  for (const target of targets) {
    try {
      const { url } = JSON.parse(decryptSecret(target.configEncrypted)) as { url?: string };
      if (!url) continue;
      const body =
        target.type === "discord"
          ? { content: formatNotice(notice) }
          : { event: "deployment.failed", ...notice };
      const response = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        console.error(`[enerthya-worker] channel ${target.id} answered ${response.status}`);
      }
    } catch (error) {
      console.error(
        `[enerthya-worker] channel ${target.id} failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
