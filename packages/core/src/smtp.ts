export type SmtpConfig = {
  host: string;
  port: number;
  /** Implicit TLS (465) rather than STARTTLS. */
  secure: boolean;
  user?: string;
  password?: string;
  /** The envelope sender, e.g. "Enerthya Host <panel@example.com>". */
  from: string;
};

/**
 * SMTP settings belong to the install, not to a channel: every email channel
 * shares one relay. Read from the environment the installer writes.
 */
export function smtpConfigFromEnv(env: NodeJS.ProcessEnv = process.env): SmtpConfig | null {
  const host = env.ENERTHYA_SMTP_HOST;
  const from = env.ENERTHYA_SMTP_FROM;
  if (!host || !from) return null;

  const port = Number(env.ENERTHYA_SMTP_PORT ?? 587) || 587;
  const secure =
    (env.ENERTHYA_SMTP_SECURE ?? "").toLowerCase() === "true" ||
    (env.ENERTHYA_SMTP_SECURE === undefined && port === 465);

  return {
    host,
    port,
    secure,
    user: env.ENERTHYA_SMTP_USER,
    password: env.ENERTHYA_SMTP_PASSWORD,
    from,
  };
}
