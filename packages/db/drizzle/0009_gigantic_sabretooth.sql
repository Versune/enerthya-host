CREATE TYPE "public"."application_kind" AS ENUM('web', 'service');--> statement-breakpoint
ALTER TABLE "application" ADD COLUMN "kind" "application_kind" DEFAULT 'web' NOT NULL;--> statement-breakpoint
ALTER TABLE "application" ADD COLUMN "volumes" jsonb;