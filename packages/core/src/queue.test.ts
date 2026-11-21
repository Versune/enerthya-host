import { describe, expect, it } from "vitest";
import { redisConnection } from "./queue";

describe("redisConnection", () => {
  it("reads host and port, defaulting to 6379", () => {
    expect(redisConnection("redis://cache.internal")).toEqual({
      host: "cache.internal",
      port: 6379,
    });
    expect(redisConnection("redis://127.0.0.1:6380")).toEqual({
      host: "127.0.0.1",
      port: 6380,
    });
  });

  it("carries credentials and the database number", () => {
    expect(redisConnection("redis://user:p%40ss@redis:6379/2")).toEqual({
      host: "redis",
      port: 6379,
      username: "user",
      password: "p@ss",
      db: 2,
    });
  });

  it("enables TLS only for rediss", () => {
    expect(redisConnection("rediss://redis:6380")).toMatchObject({ tls: {} });
    expect(redisConnection("redis://redis:6379")).not.toHaveProperty("tls");
  });

  it("refuses anything that is not a Redis URL", () => {
    expect(() => redisConnection("http://redis:6379")).toThrow(/redis:\/\//);
    expect(() => redisConnection("not a url")).toThrow(/not a URL/);
    expect(() => redisConnection("redis://redis:6379/abc")).toThrow(/invalid database/);
  });
});
