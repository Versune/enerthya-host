import { z } from "zod";

export const managedDatabaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(40, "Use at most 40 characters.")
    .regex(/^[a-z][a-z0-9-]*$/, "Use lowercase letters, digits and dashes."),
  environmentId: z.string().min(1, "Choose an environment."),
  version: z.enum(["17", "16"]).default("17"),
});

export type ManagedDatabaseInput = z.infer<typeof managedDatabaseSchema>;

/**
 * An interval of zero or nothing at all turns the schedule off. Retention is
 * optional and only meaningful with a schedule.
 */
export const backupScheduleSchema = z.object({
  intervalHours: z.coerce
    .number()
    .int()
    .min(0)
    .max(24 * 30)
    .nullable()
    .default(null),
  retentionDays: z.coerce.number().int().min(0).max(365).nullable().default(null),
});

export type BackupScheduleInput = z.infer<typeof backupScheduleSchema>;
