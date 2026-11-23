import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Postgres enums are cheap to read and expensive to change, so they are kept
 * to values the product actually branches on. Anything open-ended stays text.
 */

export const memberRole = pgEnum("member_role", ["owner", "admin", "member"]);

export const serverStatus = pgEnum("server_status", ["pending", "ready", "unreachable"]);

export const environmentKind = pgEnum("environment_kind", ["production", "staging", "preview"]);

export const applicationSource = pgEnum("application_source", ["git", "image"]);

export const buildType = pgEnum("build_type", ["dockerfile", "nixpacks", "docker-compose"]);

export const deploymentStatus = pgEnum("deployment_status", [
  "queued",
  "building",
  "deploying",
  "healthcheck",
  "running",
  "failed",
  "cancelled",
  "rolled_back",
]);

export const domainStatus = pgEnum("domain_status", ["pending", "active", "failed"]);

export const databaseEngine = pgEnum("database_engine", ["postgres", "mysql", "redis", "mongodb"]);

export const databaseStatus = pgEnum("database_status", [
  "provisioning",
  "running",
  "stopped",
  "failed",
]);

export const backupStatus = pgEnum("backup_status", [
  "scheduled",
  "running",
  "succeeded",
  "failed",
]);

export const backupDestination = pgEnum("backup_destination", ["s3", "r2", "minio", "local"]);

export const notificationType = pgEnum("notification_type", ["discord", "email", "webhook"]);

export const deploymentStepName = pgEnum("deployment_step_name", [
  "image",
  "container",
  "health",
  "swap",
]);

export const deploymentStepStatus = pgEnum("deployment_step_status", ["pending", "done", "failed"]);
