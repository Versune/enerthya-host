import { describe, expect, it } from "vitest";
import { smtpConfigFromEnv } from "./smtp";

const base = {
  ENERTHYA_SMTP_HOST: "smtp.example.com",
  ENERTHYA_SMTP_FROM: "Enerthya <panel@example.com>",
};

describe("smtpConfigFromEnv", () => {
  it("is null without a host or a sender", () => {
    expect(smtpConfigFromEnv({})).toBeNull();
    expect(smtpConfigFromEnv({ ENERTHYA_SMTP_HOST: "smtp.example.com" })).toBeNull();
    expect(smtpConfigFromEnv({ ENERTHYA_SMTP_FROM: "panel@example.com" })).toBeNull();
  });

  it("defaults to port 587 with STARTTLS", () => {
    expect(smtpConfigFromEnv(base)).toMatchObject({ port: 587, secure: false });
  });

  it("treats 465 as implicit TLS, and honours an explicit flag", () => {
    expect(smtpConfigFromEnv({ ...base, ENERTHYA_SMTP_PORT: "465" })).toMatchObject({
      port: 465,
      secure: true,
    });
    expect(smtpConfigFromEnv({ ...base, ENERTHYA_SMTP_SECURE: "true" })?.secure).toBe(true);
    expect(
      smtpConfigFromEnv({ ...base, ENERTHYA_SMTP_PORT: "465", ENERTHYA_SMTP_SECURE: "false" })
        ?.secure,
    ).toBe(false);
  });

  it("carries the credentials when present", () => {
    expect(
      smtpConfigFromEnv({ ...base, ENERTHYA_SMTP_USER: "u", ENERTHYA_SMTP_PASSWORD: "p" }),
    ).toMatchObject({ user: "u", password: "p" });
  });

  it("falls back to 587 when the port is not a number", () => {
    expect(smtpConfigFromEnv({ ...base, ENERTHYA_SMTP_PORT: "nope" })?.port).toBe(587);
  });
});
