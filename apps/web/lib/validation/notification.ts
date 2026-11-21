import { z } from "zod";

const name = z.string().trim().min(2, "Use at least 2 characters.").max(60);

/**
 * Discord and webhooks are a URL; email is a recipient. The discriminated union
 * keeps the API and the form on the same rule.
 */
export const notificationSchema = z.discriminatedUnion("type", [
  z.object({
    name,
    type: z.enum(["discord", "webhook"]),
    url: z.url({ error: "Enter the full webhook URL." }),
  }),
  z.object({
    name,
    type: z.literal("email"),
    to: z.email({ error: "Enter the address that should receive the notices." }),
  }),
]);

export type NotificationInput = z.infer<typeof notificationSchema>;
