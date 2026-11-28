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

if (existsSync(pnpm)) {
  for (const name of ["ssh2"]) {
    const dir = readdirSync(pnpm).find((entry) => entry === name || entry.startsWith(`${name}@`));
    if (!dir) continue;

    const link = join(standalone, "node_modules", name);
    if (existsSync(link)) continue;

    symlinkSync(join(".pnpm", dir, "node_modules", name), link, "dir");
    console.log(`linked standalone node_modules/${name} -> .pnpm/${dir}`);
  }
}

// Next's standalone output does not include the compiled CSS/JS chunks or public/.
// The standalone server serves them from disk, so link them next to server.js;
// without this the panel renders unstyled and every /_next/static asset 404s.
const app = join(standalone, "apps", "web");
for (const [src, dest, label] of [
  [join(process.cwd(), ".next", "static"), join(app, ".next", "static"), ".next/static"],
  [join(process.cwd(), "public"), join(app, "public"), "public"],
]) {
  if (!existsSync(src) || existsSync(dest)) continue;
  symlinkSync(src, dest, "dir");
  console.log(`linked standalone apps/web/${label}`);
}
