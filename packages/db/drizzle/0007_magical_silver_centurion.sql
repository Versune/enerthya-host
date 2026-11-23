CREATE TYPE "public"."deployment_step_name" AS ENUM('image', 'container', 'health', 'swap');--> statement-breakpoint
CREATE TYPE "public"."deployment_step_status" AS ENUM('pending', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "deployment_step" (
	"id" text PRIMARY KEY NOT NULL,
	"deployment_id" text NOT NULL,
	"name" "deployment_step_name" NOT NULL,
	"status" "deployment_step_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "deployment_step" ADD CONSTRAINT "deployment_step_deployment_id_deployment_id_fk" FOREIGN KEY ("deployment_id") REFERENCES "public"."deployment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deployment_step_key_idx" ON "deployment_step" USING btree ("deployment_id","name");