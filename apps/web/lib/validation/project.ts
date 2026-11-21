import { z } from "zod";

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(60, "Use at most 60 characters."),
  description: z
    .string()
    .trim()
    .max(280, "Use at most 280 characters.")
    .optional()
    .or(z.literal("")),
});

export type ProjectInput = z.infer<typeof projectSchema>;
