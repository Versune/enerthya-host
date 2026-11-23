ALTER TABLE "deployment_step" DROP CONSTRAINT "deployment_step_deployment_id_name_pk";--> statement-breakpoint
ALTER TABLE "deployment_step" ADD COLUMN "id" text PRIMARY KEY NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "deployment_step_key_idx" ON "deployment_step" USING btree ("deployment_id","name");