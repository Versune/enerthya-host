import { createHash, createHmac } from "node:crypto";

export type S3Config = {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

export type SignedRequest = {
  url: string;
  headers: Record<string, string>;
};

/**
 * AWS Signature V4 for a single PUT. Written out rather than pulled in as a
 * dependency: it is a fixed, well-documented transformation and the worker only
 * ever needs this one verb.
 */
export function signPutObject(
  config: S3Config,
  key: string,
  body: Buffer,
  now = new Date(),
): SignedRequest {
  return signRequest(config, "PUT", key, sha256Hex(body), now);
}

/** AWS Signature V4 for a DELETE; the payload hash is the empty-body digest. */
export function signDeleteObject(config: S3Config, key: string, now = new Date()): SignedRequest {
  return signRequest(config, "DELETE", key, sha256Hex(Buffer.alloc(0)), now);
}

function signRequest(
  config: S3Config,
  method: string,
  key: string,
  payloadHash: string,
  now: Date,
): SignedRequest {
  const endpoint = config.endpoint.replace(/\/$/, "");
  const url = new URL(`${endpoint}/${config.bucket}/${key}`);
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);

  const headers: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalRequest = [
    method,
    url.pathname,
    "",
    `${Object.keys(headers)
      .sort()
      .map((name) => `${name}:${headers[name]}`)
      .join("\n")}\n`,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(Buffer.from(canonicalRequest, "utf8")),
  ].join("\n");

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${config.secretAccessKey}`, dateStamp), config.region), "s3"),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  return {
    url: url.toString(),
    headers: {
      ...headers,
      authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  };
}

/** Uploads one object. Throws with the service's message when it refuses. */
export async function putObject(config: S3Config, key: string, body: Buffer): Promise<void> {
  const request = signPutObject(config, key, body);
  const response = await fetch(request.url, {
    method: "PUT",
    headers: request.headers,
    body: new Uint8Array(body),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(
      `The bucket refused the upload (${response.status}): ${(await response.text()).slice(0, 200)}`,
    );
  }
}

/** Removes one object. A 404 counts as success: the goal is that it is gone. */
export async function deleteObject(config: S3Config, key: string): Promise<void> {
  const request = signDeleteObject(config, key);
  const response = await fetch(request.url, {
    method: "DELETE",
    headers: request.headers,
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok && response.status !== 404) {
    throw new Error(
      `The bucket refused the delete (${response.status}): ${(await response.text()).slice(0, 200)}`,
    );
  }
}

/** Reads the destination from the install's environment, or null when unset. */
export function s3ConfigFromEnv(env: NodeJS.ProcessEnv = process.env): S3Config | null {
  const endpoint = env.ENERTHYA_S3_ENDPOINT;
  const bucket = env.ENERTHYA_S3_BUCKET;
  const accessKeyId = env.ENERTHYA_S3_ACCESS_KEY_ID;
  const secretAccessKey = env.ENERTHYA_S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;
  return {
    endpoint,
    bucket,
    region: env.ENERTHYA_S3_REGION ?? "auto",
    accessKeyId,
    secretAccessKey,
  };
}
