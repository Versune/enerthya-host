import { getTableColumns, getTableName, isTable } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import * as schema from "../src/schema";

const EXPECTED_TABLES = [
  "account",
  "application",
  "backup",
  "database",
  "deployment",
  "deployment_step",
  "domain",
  "environment",
  "environment_variable",
  "invitation",
  "member",
  "notification_channel",
  "organization",
  "project",
  "server",
  "session",
  "two_factor",
  "user",
  "verification",
];

function tables(): PgTable[] {
  // The barrel also exports enums and relations; only tables answer isTable.
  return Object.values(schema).filter((value) => isTable(value)) as PgTable[];
}

describe("schema", () => {
  it("defines every table the product needs, and no orphans", () => {
    const names = tables()
      .map((table) => getTableName(table))
      .sort();
    expect(names).toEqual(EXPECTED_TABLES);
  });

  it("gives every table an id primary key", () => {
    for (const table of tables()) {
      const columns = getTableColumns(table);
      expect(columns.id, getTableName(table)).toBeDefined();
      expect(columns.id.primary, getTableName(table)).toBe(true);
    }
  });

  it("stores every secret column encrypted, never as plaintext", () => {
    const secretColumns = tables().flatMap((table) =>
      Object.values(getTableColumns(table))
        .filter((column) => column.name.endsWith("_encrypted"))
        .map((column) => `${getTableName(table)}.${column.name}`),
    );

    expect(secretColumns).toEqual(
      expect.arrayContaining([
        "application.deploy_key_encrypted",
        "database.credentials_encrypted",
        "environment_variable.value_encrypted",
        "notification_channel.config_encrypted",
        "server.private_key_encrypted",
      ]),
    );

    // better-auth keeps the password hash on the account row, never on the user.
    const userColumns = Object.values(getTableColumns(schema.users)).map((column) => column.name);
    expect(userColumns).not.toContain("password");
  });

  it("keeps roles and deployment states to the values the product branches on", () => {
    expect(schema.memberRole.enumValues).toEqual(["owner", "admin", "member"]);
    expect(schema.deploymentStatus.enumValues).toEqual([
      "queued",
      "building",
      "deploying",
      "healthcheck",
      "running",
      "failed",
      "cancelled",
      "rolled_back",
    ]);
  });
});
