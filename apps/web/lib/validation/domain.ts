import { z } from "zod";

export const domainSchema = z.object({
  hostname: z
    .string()
    .trim()
    .toLowerCase()
    .min(4, "Enter a domain.")
    .max(253, "Use at most 253 characters.")
    .regex(
      /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
      "Use a domain like app.example.com, without a scheme or path.",
    ),
});

export type DomainInput = z.infer<typeof domainSchema>;
