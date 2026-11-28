import { z } from "zod";

const name = z.string().trim().min(2, "Use at least 2 characters.").max(60);

/**
 * Notifications are delivered by the worker from inside the host network, so a
 * webhook URL is an SSRF sink by construction. Only public https endpoints are
 * accepted: loopback, link-local metadata and RFC1918 literals are refused.
 * Hostnames are checked literally; DNS rebinding stays the worker's boundary.
 */
const PRIVATE_IPV4 = /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

function isPublicWebhookUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return false;
  }
  if (host.startsWith("[") || host.includes(":")) {
    const bare = host.replace(/^\[|\]$/g, "");
    if (
      bare === "::1" ||
      bare.startsWith("fe80") ||
      bare.startsWith("fc") ||
      bare.startsWith("fd")
    ) {
      return false;
    }
  }
  return !PRIVATE_IPV4.test(host);
}

/**
 * Discord and webhooks are a URL; email is a recipient. The discriminated union
 * keeps the API and the form on the same rule.
 */
export const notificationSchema = z.discriminatedUnion("type", [
  z.object({
    name,
    type: z.enum(["discord", "webhook"]),
    url: z
      .url({ error: "Enter the full webhook URL." })
      .refine(
        isPublicWebhookUrl,
        "Use a public https:// endpoint; loopback and private addresses are refused.",
      ),
  }),
  z.object({
    name,
    type: z.literal("email"),
    to: z.email({ error: "Enter the address that should receive the notices." }),
  }),
]);

export type NotificationInput = z.infer<typeof notificationSchema>;
