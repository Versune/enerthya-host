import { z } from "zod";

/**
 * One schema per form, shared by the client and (later) any route that wraps
 * better-auth. better-auth validates again on the server; this exists so the
 * form can refuse obvious input without a round trip.
 */

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(80, "Use at most 80 characters."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Enter a valid email address." })),
  password: z.string().min(12, "Use at least 12 characters."),
  organization: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(80, "Use at most 80 characters."),
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Enter a valid email address." })),
  password: z.string().min(1, "Enter your password."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the values and try again.";
}
