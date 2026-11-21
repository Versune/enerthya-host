import { decryptSecret } from "@enerthya/core/crypto";
import { smtpConfigFromEnv } from "@enerthya/core/smtp";
import { getDb, selectDeliveryTargets } from "@enerthya/db";
import { render } from "@react-email/render";
import nodemailer, { type Transporter } from "nodemailer";
import { createElement } from "react";
import { DeploymentFailedEmail } from "./email/deployment-failed";
import { logger } from "./log";

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

type EmailConfig = { to?: string };

/** One relay for the install; built once and reused by every message. */
let transport: Transporter | null = null;

function mailer(): Transporter | null {
  const config = smtpConfigFromEnv();
  if (!config) return null;
  transport ??= nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user && config.password ? { user: config.user, pass: config.password } : undefined,
  });
  return transport;
}

async function sendEmail(target: { id: string; configEncrypted: string }, notice: FailureNotice) {
  const config = JSON.parse(decryptSecret(target.configEncrypted)) as EmailConfig;
  if (!config.to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(config.to)) {
    logger.warn({ channelId: target.id }, "email channel has no valid recipient");
    return;
  }

  const smtp = smtpConfigFromEnv();
  const sender = mailer();
  if (!smtp || !sender) {
    // The channel is configured but the install is not: say so once per send
    // rather than pretending the mail went out.
    logger.warn({ channelId: target.id }, "email channel skipped: SMTP is not configured");
    return;
  }

  const html = await render(
    createElement(DeploymentFailedEmail, {
      applicationName: notice.applicationName,
      error: notice.error,
      deploymentId: notice.deploymentId,
      panelUrl: process.env.BETTER_AUTH_URL,
    }),
  );

  await sender.sendMail({
    from: smtp.from,
    to: config.to,
    subject: `Deployment failed: ${notice.applicationName}`,
    text: formatNotice(notice),
    html,
  });
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
      if (target.type === "email") {
        await sendEmail(target, notice);
        continue;
      }

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
        logger.warn(
          { channelId: target.id, status: response.status },
          "channel refused the notice",
        );
      }
    } catch (error) {
      logger.error(
        { channelId: target.id, err: error instanceof Error ? error.message : String(error) },
        "channel failed",
      );
    }
  }
}
