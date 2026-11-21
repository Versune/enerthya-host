ALTER TABLE "database" ADD COLUMN "backup_interval_hours" integer;--> statement-breakpoint
ALTER TABLE "database" ADD COLUMN "backup_retention_days" integer;--> statement-breakpoint
ALTER TABLE "database" ADD COLUMN "last_backup_at" timestamp with time zone;