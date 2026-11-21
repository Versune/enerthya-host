import { z } from "zod";

export const notificationSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(60),
  type: z.enum(["discord", "webhook"]),
  url: z.url({ error: "Enter the full webhook URL." }),
});

export type NotificationInput = z.infer<typeof notificationSchema>;
