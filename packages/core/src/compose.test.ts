import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const compose = readFileSync(new URL("../../../docker/compose.yml", import.meta.url), "utf8");

/**
 * The shipped compose is the install. The worker reads these settings; if the
 * file stops passing them, the feature is silently off on every install and
 * the docs are the only place that still says otherwise.
 */
describe("docker/compose.yml", () => {
  it("passes every SMTP and S3 setting the worker reads", () => {
    for (const key of [
      "ENERTHYA_SMTP_HOST",
      "ENERTHYA_SMTP_PORT",
      "ENERTHYA_SMTP_SECURE",
      "ENERTHYA_SMTP_USER",
      "ENERTHYA_SMTP_PASSWORD",
      "ENERTHYA_SMTP_FROM",
      "ENERTHYA_S3_ENDPOINT",
      "ENERTHYA_S3_BUCKET",
      "ENERTHYA_S3_REGION",
      "ENERTHYA_S3_ACCESS_KEY_ID",
      "ENERTHYA_S3_SECRET_ACCESS_KEY",
    ]) {
      expect(compose, key).toContain(`${key}:`);
    }
  });

  it("keeps local backups in a volume, not in the worker's writable layer", () => {
    expect(compose).toContain("backups:/data/enerthya/backups");
    expect(compose).toMatch(/^volumes:\n(?: {2}\S+\n)* {2}backups:/m);
  });
});
