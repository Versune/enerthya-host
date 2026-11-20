#!/usr/bin/env node
/**
 * pnpm keeps packages under node_modules/.pnpm and links only what the app
 * imports directly. Next marks ssh2 as a server-external package, so the
 * standalone server needs a resolvable node_modules/ssh2 entry; without it
 * every SSH probe fails with MODULE_NOT_FOUND.
 */
import { existsSync, readdirSync, symlinkSync } from "node:fs";
import { join } from "node:path";

const standalone = join(process.cwd(), ".next", "standalone");
const pnpm = join(standalone, "node_modules", ".pnpm");
if (!existsSync(pnpm)) process.exit(0);

for (const name of ["ssh2"]) {
  const dir = readdirSync(pnpm).find((entry) => entry === name || entry.startsWith(`${name}@`));
  if (!dir) continue;

  const link = join(standalone, "node_modules", name);
  if (existsSync(link)) continue;

  symlinkSync(join(".pnpm", dir, "node_modules", name), link, "dir");
  console.log(`linked standalone node_modules/${name} -> .pnpm/${dir}`);
}
