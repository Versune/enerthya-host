import { utils } from "ssh2";

/**
 * A deploy key per application: the private half is encrypted at rest and only
 * the worker uses it to clone; the public half is what an operator pastes into
 * the repository as a read-only deploy key.
 */
export type DeployKey = { privateKey: string; publicKey: string };

export function generateDeployKey(comment = "enerthya-host"): DeployKey {
  const pair = utils.generateKeyPairSync("ed25519");
  return { privateKey: pair.private, publicKey: `${pair.public} ${comment}` };
}

/** Rebuilds the public half from the stored private key. */
export function publicKeyFromPrivate(privateKey: string, comment = "enerthya-host"): string | null {
  const parsed = utils.parseKey(privateKey);
  if (parsed instanceof Error) return null;
  const ssh = Array.isArray(parsed) ? parsed[0]?.getPublicSSH() : parsed.getPublicSSH();
  if (!ssh) return null;
  return `${parsed instanceof Array ? parsed[0]?.type : parsed.type} ${ssh.toString("base64")} ${comment}`;
}
