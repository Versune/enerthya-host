import { z } from "zod";

export const applicationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Use at least 2 characters.")
      .max(60, "Use at most 60 characters."),
    environmentId: z.string().min(1, "Choose an environment."),
    sourceType: z.enum(["git", "image"]),
    gitUrl: z
      .string()
      .trim()
      .optional()
      .transform((value) => value ?? "")
      .pipe(
        z.union([
          z.literal(""),
          z.url({ error: "Enter a valid repository URL." }),
          // git@github.com:owner/repo.git — the form a private repository
          // usually has, and not a URL.
          z
            .string()
            .regex(
              /^[a-z0-9._-]+@[a-z0-9.-]+:[A-Za-z0-9._/-]+$/,
              "Enter an https:// URL or an SSH address like git@github.com:owner/repo.git.",
            ),
        ]),
      ),
    dockerImage: z.string().trim().max(255).optional().or(z.literal("")),
    gitBranch: z.string().trim().min(1).max(120).default("main"),
    buildType: z.enum(["dockerfile", "nixpacks", "docker-compose"]).default("nixpacks"),
    port: z.coerce
      .number()
      .int("The port must be a whole number.")
      .min(1, "Use a port between 1 and 65535.")
      .max(65535, "Use a port between 1 and 65535."),
    healthcheckPath: z
      .string()
      .trim()
      .startsWith("/", "Start with /.")
      .max(200, "Use at most 200 characters.")
      .default("/"),
  })
  .superRefine((value, context) => {
    if (value.sourceType === "git" && !value.gitUrl) {
      context.addIssue({
        code: "custom",
        path: ["gitUrl"],
        message: "Enter the repository URL.",
      });
    }
    if (value.sourceType === "image" && !value.dockerImage) {
      context.addIssue({
        code: "custom",
        path: ["dockerImage"],
        message: "Enter the image reference.",
      });
    }
  });

export type ApplicationInput = z.infer<typeof applicationSchema>;
