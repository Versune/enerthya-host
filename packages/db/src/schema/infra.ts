import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./auth";
import {
  applicationSource,
  backupDestination,
  backupStatus,
  buildType,
  databaseEngine,
  databaseStatus,
  deploymentStatus,
  deploymentStepName,
  deploymentStepStatus,
  domainStatus,
  environmentKind,
  notificationType,
  serverStatus,
} from "./enums";

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

/**
 * Every secret in this file is stored encrypted with AES-256-GCM and the
 * ENCRYPTION_KEY from the environment. Columns ending in `_encrypted` never
 * hold plaintext and are never selected into an API response as-is.
 */

export const servers = pgTable(
  "server",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    host: text("host").notNull(),
    port: integer("port").notNull().default(22),
    username: text("username").notNull().default("root"),
    privateKeyEncrypted: text("private_key_encrypted"),
    isLocal: boolean("is_local").notNull().default(false),
    status: serverStatus("status").notNull().default("pending"),
    dockerVersion: text("docker_version"),
    // SHA256 base64 of the host key, pinned on first successful probe.
    hostKeyFingerprint: text("host_key_fingerprint"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("server_org_name_idx").on(table.organizationId, table.name)],
);

export const projects = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("project_org_slug_idx").on(table.organizationId, table.slug)],
);

export const environments = pgTable(
  "environment",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    kind: environmentKind("kind").notNull().default("production"),
    createdAt,
  },
  (table) => [uniqueIndex("environment_project_slug_idx").on(table.projectId, table.slug)],
);

export const applications = pgTable(
  "application",
  {
    id: text("id").primaryKey(),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    serverId: text("server_id").references(() => servers.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),

    sourceType: applicationSource("source_type").notNull(),
    gitUrl: text("git_url"),
    gitBranch: text("git_branch").notNull().default("main"),
    gitProvider: text("git_provider"),
    dockerImage: text("docker_image"),

    buildType: buildType("build_type").notNull().default("nixpacks"),
    dockerfilePath: text("dockerfile_path"),
    composePath: text("compose_path"),
    baseDirectory: text("base_directory"),

    port: integer("port").notNull().default(3000),
    healthcheckPath: text("healthcheck_path").notNull().default("/"),
    healthcheckIntervalSeconds: integer("healthcheck_interval_seconds").notNull().default(10),
    replicas: integer("replicas").notNull().default(1),
    autoDeploy: boolean("auto_deploy").notNull().default(true),

    webhookSecret: text("webhook_secret"),
    deployKeyEncrypted: text("deploy_key_encrypted"),

    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("application_env_slug_idx").on(table.environmentId, table.slug),
    index("application_server_id_idx").on(table.serverId),
  ],
);

export const deployments = pgTable(
  "deployment",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    status: deploymentStatus("status").notNull().default("queued"),
    commitSha: text("commit_sha"),
    imageTag: text("image_tag"),
    containerId: text("container_id"),
    /** Host port the runtime published, so a domain can be pointed at it. */
    hostPort: integer("host_port"),
    logPath: text("log_path"),
    /** Build and deploy output, one line per step. */
    log: text("log"),
    error: text("error"),
    rollbackOfId: text("rollback_of_id").references((): AnyPgColumn => deployments.id, {
      onDelete: "set null",
    }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [
    index("deployment_application_idx").on(table.applicationId, table.createdAt),
    index("deployment_status_idx").on(table.status),
  ],
);

/**
 * One row per step of a deployment. The status on `deployment` says how far the
 * deployment got; this says which work is finished, so a retried job resumes
 * instead of cloning the repository again.
 */
export const deploymentSteps = pgTable(
  "deployment_step",
  {
    // One row per (deployment, step); the id is that pair, so a re-recorded
    // step updates instead of duplicating.
    id: text("id").primaryKey(),
    deploymentId: text("deployment_id")
      .notNull()
      .references(() => deployments.id, { onDelete: "cascade" }),
    name: deploymentStepName("name").notNull(),
    status: deploymentStepStatus("status").notNull().default("pending"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    error: text("error"),
  },
  (table) => [uniqueIndex("deployment_step_key_idx").on(table.deploymentId, table.name)],
);

export const domains = pgTable(
  "domain",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    hostname: text("hostname").notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    status: domainStatus("status").notNull().default("pending"),
    sslIssuedAt: timestamp("ssl_issued_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("domain_hostname_idx").on(table.hostname)],
);

export const environmentVariables = pgTable(
  "environment_variable",
  {
    id: text("id").primaryKey(),
    applicationId: text("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    valueEncrypted: text("value_encrypted").notNull(),
    isBuildTime: boolean("is_build_time").notNull().default(false),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("environment_variable_app_key_idx").on(table.applicationId, table.key)],
);

export const databases = pgTable(
  "database",
  {
    id: text("id").primaryKey(),
    environmentId: text("environment_id")
      .notNull()
      .references(() => environments.id, { onDelete: "cascade" }),
    serverId: text("server_id").references(() => servers.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    engine: databaseEngine("engine").notNull(),
    version: text("version").notNull(),
    port: integer("port").notNull(),
    volumeName: text("volume_name").notNull(),
    credentialsEncrypted: text("credentials_encrypted").notNull(),
    status: databaseStatus("status").notNull().default("provisioning"),
    /** Hours between automatic backups; null means no schedule. */
    backupIntervalHours: integer("backup_interval_hours"),
    /** Days a successful backup is kept before retention removes it. */
    backupRetentionDays: integer("backup_retention_days"),
    /** When the scheduler last enqueued a backup for this database. */
    lastBackupAt: timestamp("last_backup_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("database_env_name_idx").on(table.environmentId, table.name)],
);

export const backups = pgTable(
  "backup",
  {
    id: text("id").primaryKey(),
    databaseId: text("database_id")
      .notNull()
      .references(() => databases.id, { onDelete: "cascade" }),
    status: backupStatus("status").notNull().default("scheduled"),
    destination: backupDestination("destination").notNull().default("s3"),
    storagePath: text("storage_path"),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    /** Set only after the dump was restored into a throwaway server. */
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [index("backup_database_idx").on(table.databaseId, table.createdAt)],
);

export const notificationChannels = pgTable(
  "notification_channel",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: notificationType("type").notNull(),
    configEncrypted: text("config_encrypted").notNull(),
    events: jsonb("events").$type<string[]>().notNull().default([]),
    enabled: boolean("enabled").notNull().default(true),
    createdAt,
    updatedAt,
  },
  (table) => [index("notification_channel_org_idx").on(table.organizationId)],
);

export const serversRelations = relations(servers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [servers.organizationId],
    references: [organizations.id],
  }),
  applications: many(applications),
  databases: many(databases),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  environments: many(environments),
}));

export const environmentsRelations = relations(environments, ({ one, many }) => ({
  project: one(projects, { fields: [environments.projectId], references: [projects.id] }),
  applications: many(applications),
  databases: many(databases),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  environment: one(environments, {
    fields: [applications.environmentId],
    references: [environments.id],
  }),
  server: one(servers, { fields: [applications.serverId], references: [servers.id] }),
  deployments: many(deployments),
  domains: many(domains),
  variables: many(environmentVariables),
}));

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  application: one(applications, {
    fields: [deployments.applicationId],
    references: [applications.id],
  }),
  rollbackOf: one(deployments, {
    fields: [deployments.rollbackOfId],
    references: [deployments.id],
    relationName: "rollback",
  }),
}));

export const domainsRelations = relations(domains, ({ one }) => ({
  application: one(applications, {
    fields: [domains.applicationId],
    references: [applications.id],
  }),
}));

export const environmentVariablesRelations = relations(environmentVariables, ({ one }) => ({
  application: one(applications, {
    fields: [environmentVariables.applicationId],
    references: [applications.id],
  }),
}));

export const databasesRelations = relations(databases, ({ one, many }) => ({
  environment: one(environments, {
    fields: [databases.environmentId],
    references: [environments.id],
  }),
  server: one(servers, { fields: [databases.serverId], references: [servers.id] }),
  backups: many(backups),
}));

export const backupsRelations = relations(backups, ({ one }) => ({
  database: one(databases, { fields: [backups.databaseId], references: [databases.id] }),
}));

export const notificationChannelsRelations = relations(notificationChannels, ({ one }) => ({
  organization: one(organizations, {
    fields: [notificationChannels.organizationId],
    references: [organizations.id],
  }),
}));
