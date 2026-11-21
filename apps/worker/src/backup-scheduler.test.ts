import { describe, expect, it } from "vitest";
import { keyFromStoragePath } from "./backup-scheduler";

describe("keyFromStoragePath", () => {
  it("drops the scheme and bucket from a stored S3 path", () => {
    expect(keyFromStoragePath("s3://backups/backups/db-1/abc.dump")).toBe("backups/db-1/abc.dump");
  });

  it("keeps a key that has no scheme", () => {
    expect(keyFromStoragePath("db-1/abc.dump")).toBe("db-1/abc.dump");
  });

  it("handles a bucket name that repeats in the key", () => {
    expect(keyFromStoragePath("s3://backups/backups/x.dump")).toBe("backups/x.dump");
  });
});
