import { z } from "zod";

export const serverSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(60, "Use at most 60 characters."),
  host: z
    .string()
    .trim()
    .min(1, "Enter a hostname or IP address.")
    .max(255)
    .regex(/^[a-zA-Z0-9._:-]+$/, "Use a hostname or IP address, without spaces."),
  port: z.coerce
    .number()
    .int("The port must be a whole number.")
    .min(1, "Use a port between 1 and 65535.")
    .max(65535, "Use a port between 1 and 65535."),
  username: z
    .string()
    .trim()
    .min(1, "Enter the SSH user.")
    .max(32)
    .regex(/^[a-z_][a-z0-9_-]*$/i, "Use a valid Unix user name."),
  privateKey: z
    .string()
    .max(16384, "That key is larger than an SSH key should be.")
    .optional()
    .or(z.literal("")),
});

export type ServerInput = z.infer<typeof serverSchema>;
