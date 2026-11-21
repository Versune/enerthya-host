import { describe, expect, it } from "vitest";
import { s3ConfigFromEnv, signDeleteObject, signPutObject } from "./s3";

const config = {
  endpoint: "https://s3.example.com",
  bucket: "backups",
  region: "auto",
  accessKeyId: "AKIAEXAMPLE",
  secretAccessKey: "secret",
};

describe("signPutObject", () => {
  const signed = signPutObject(
    config,
    "db/1.dump",
    Buffer.from("payload"),
    new Date("2026-01-02T03:04:05Z"),
  );

  it("addresses the object under the bucket", () => {
    expect(signed.url).toBe("https://s3.example.com/backups/db/1.dump");
  });

  it("signs host, date and payload hash", () => {
    expect(signed.headers["x-amz-date"]).toBe("20260102T030405Z");
    expect(signed.headers["x-amz-content-sha256"]).toMatch(/^[0-9a-f]{64}$/);
    expect(signed.headers.authorization).toContain(
      "SignedHeaders=host;x-amz-content-sha256;x-amz-date",
    );
    expect(signed.headers.authorization).toContain(
      "Credential=AKIAEXAMPLE/20260102/auto/s3/aws4_request",
    );
    expect(signed.headers.authorization).toMatch(/Signature=[0-9a-f]{64}$/);
  });

  it("changes the signature when the body changes", () => {
    const other = signPutObject(
      config,
      "db/1.dump",
      Buffer.from("tampered"),
      new Date("2026-01-02T03:04:05Z"),
    );
    expect(other.headers.authorization).not.toBe(signed.headers.authorization);
  });
});

describe("signDeleteObject", () => {
  const at = new Date("2026-01-02T03:04:05Z");
  const signed = signDeleteObject(config, "db/1.dump", at);

  it("addresses the same object as the upload", () => {
    expect(signed.url).toBe("https://s3.example.com/backups/db/1.dump");
  });

  it("signs the empty-body digest", () => {
    expect(signed.headers["x-amz-content-sha256"]).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("produces a different signature from a PUT of the same key", () => {
    const put = signPutObject(config, "db/1.dump", Buffer.alloc(0), at);
    expect(signed.headers.authorization).not.toBe(put.headers.authorization);
  });
});

describe("s3ConfigFromEnv", () => {
  it("returns null unless every field is present", () => {
    expect(s3ConfigFromEnv({})).toBeNull();
    expect(s3ConfigFromEnv({ ENERTHYA_S3_ENDPOINT: "https://s3.example.com" })).toBeNull();
  });

  it("defaults the region to auto for Cloudflare R2", () => {
    const parsed = s3ConfigFromEnv({
      ENERTHYA_S3_ENDPOINT: "https://s3.example.com",
      ENERTHYA_S3_BUCKET: "backups",
      ENERTHYA_S3_ACCESS_KEY_ID: "id",
      ENERTHYA_S3_SECRET_ACCESS_KEY: "secret",
    });
    expect(parsed).toMatchObject({ bucket: "backups", region: "auto" });
  });
});
