import { smtpConfigFromEnv } from "@enerthya/core/smtp";
import { type ChannelListener, getDb, listenToChannel } from "@enerthya/db";
import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./log";

export type EmailRequest = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

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

/**
 * Sends a message the panel built. The panel never holds the relay credentials;
 * it asks over a channel, the way it asks for container output.
 */
export function startEmailServer(databaseUrl: string): ChannelListener {
  const db = getDb();

  return listenToChannel(databaseUrl, "email_send", (payload) => {
    void (async () => {
      let request: EmailRequest;
      try {
        request = JSON.parse(payload) as EmailRequest;
      } catch {
        return;
      }
      if (!request.to || !request.subject) return;

      const smtp = smtpConfigFromEnv();
      const sender = mailer();
      if (!smtp || !sender) {
        logger.warn({ to: request.to }, "email skipped: SMTP is not configured");
        return;
      }

      try {
        await sender.sendMail({
          from: smtp.from,
          to: request.to,
          subject: request.subject,
          text: request.text,
          html: request.html,
        });
        logger.info({ to: request.to, subject: request.subject }, "email sent");
      } catch (error) {
        logger.error({ to: request.to, err: (error as Error).message }, "email failed");
      }
    })();
  });
}
