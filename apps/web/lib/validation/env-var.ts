import { z } from "zod";

export const envVarSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Enter a name.")
    .max(128, "Use at most 128 characters.")
    .regex(
      /^[A-Za-z_][A-Za-z0-9_]*$/,
      "Use letters, digits and underscores; do not start with a digit.",
    ),
  value: z.string().max(8192, "Use at most 8192 characters."),
  isBuildTime: z.boolean().default(false),
});

export type EnvVarInput = z.infer<typeof envVarSchema>;
