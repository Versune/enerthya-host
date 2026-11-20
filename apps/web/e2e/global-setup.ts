import { rm } from "node:fs/promises";
import path from "node:path";

/**
 * The legacy panel keeps its account on disk. Every e2e run starts from a
 * machine with no administrator so the setup flow is deterministic.
 */
export default async function globalSetup() {
  await rm(path.join(process.cwd(), "e2e", ".state"), { recursive: true, force: true });
}
