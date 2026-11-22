#!/usr/bin/env node
/**
 * Turns a release spec into a video and a contact sheet.
 *
 * Deliberately dependency-free: ffmpeg draws each slide to a PNG and joins them
 * with a cross-fade, so a release video needs nothing installed beyond ffmpeg.
 * Real screenshots are the point of the thing; there is no fake UI here.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const specPath = process.argv[2];
if (!specPath) {
  console.error("usage: render.mjs marketing/releases/v0.12.13/video.json");
  process.exit(2);
}

const spec = JSON.parse(readFileSync(specPath, "utf8"));
const base = dirname(resolve(specPath));
const width = spec.width ?? 1920;
const height = spec.height ?? 1080;
const fps = spec.fps ?? 30;
const slides = spec.slides ?? [];

if (slides.length === 0) {
  console.error("the spec has no slides");
  process.exit(1);
}

const build = join(base, ".build");
rmSync(build, { recursive: true, force: true });
mkdirSync(build, { recursive: true });

function ffmpeg(args) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: ["ignore", "inherit", "inherit"] });
}

/** The container has DejaVu by default; ffmpeg needs an explicit file. */
function fontPath(family) {
  try {
    return execFileSync("fc-match", ["-f", "%{file}", family], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

const mono = fontPath("DejaVu Sans Mono");
const sans = fontPath("DejaVu Sans");
if (!sans) {
  console.error("no font found; install fonts-dejavu");
  process.exit(1);
}

/** Escapes a value for an ffmpeg filter argument. */
function esc(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

function textFile(name, content) {
  const file = join(build, `${name}.txt`);
  writeFileSync(file, content);
  return file;
}

const frames = [];

slides.forEach((slide, index) => {
  const name = `frame-${String(index + 1).padStart(2, "0")}`;
  const png = join(build, `${name}.png`);
  const seconds = slide.seconds ?? 4;
  const title = slide.title ?? "";
  const body = slide.body ?? "";
  const footer = `${spec.version ?? ""} · enerthya`;

  const titleFile = textFile(`${name}-title`, title);
  const bodyFile = textFile(`${name}-body`, body);
  const footerFile = textFile(`${name}-footer`, footer);

  const drawText = [
    mono
      ? `drawtext=fontfile='${esc(mono)}':textfile='${esc(titleFile)}':fontcolor=0x111111:fontsize=${slide.kind === "title" ? 96 : 64}:x=(w-text_w)/2:y=${slide.kind === "title" ? "h/2-160" : 140}:line_spacing=12`
      : null,
    `drawtext=fontfile='${esc(mono)}':textfile='${esc(bodyFile)}':fontcolor=0x555555:fontsize=${slide.kind === "title" ? 36 : 44}:x=(w-text_w)/2:y=${slide.kind === "title" ? "h/2+40" : "h-400"}:line_spacing=18`,
    `drawtext=fontfile='${esc(mono)}':textfile='${esc(footerFile)}':fontcolor=0x999999:fontsize=22:x=80:y=h-70`,
  ]
    .filter(Boolean)
    .join(",");

  if (slide.kind === "screenshot" && slide.image) {
    const image = resolve(base, slide.image);
    if (!existsSync(image)) {
      console.error(`missing screenshot: ${slide.image}`);
      process.exit(1);
    }
    // Screenshot sits under the title, scaled to fit with a hairline border.
    ffmpeg([
      "-f", "lavfi", "-i", `color=c=0xf7f6f3:s=${width}x${height}:d=1`,
      "-i", image,
      "-filter_complex",
      [
        `[1:v]scale=${width - 320}:${height - 420}:force_original_aspect_ratio=decrease,pad=iw+2:ih+2:1:1:color=0xd9d9d9[shot]`,
        `[0:v][shot]overlay=(W-w)/2:${Math.round(height - 380)},${drawText}`,
      ].join(";"),
      "-frames:v", "1", "-update", "1", png,
    ]);
  } else {
    ffmpeg([
      "-f", "lavfi", "-i", `color=c=0xf7f6f3:s=${width}x${height}:d=1`,
      "-vf", `${drawText},drawbox=x=80:y=80:w=${width - 160}:h=2:color=0x111111@0.2:t=fill`,
      "-frames:v", "1", "-update", "1", png,
    ]);
  }

  frames.push({ png, seconds });
});

// One second of black between slides reads as a cut; the concat demuxer keeps
// it simple, and the mp4 can be re-cut by anyone who wants transitions.
const listFile = join(build, "list.txt");
writeFileSync(
  listFile,
  frames
    .map((frame) => `file '${frame.png.replace(/'/g, "'\\''")}'\nduration ${frame.seconds}`)
    .join("\n") + `\nfile '${frames.at(-1).png.replace(/'/g, "'\\''")}'\n`,
);

const output = join(base, "release.mp4");
ffmpeg([
  "-f", "concat", "-safe", "0", "-i", listFile,
  "-vf", `fps=${fps},format=yuv420p`,
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-movflags", "+faststart",
  output,
]);

// Two columns read better than three when a release has four slides; a blank
// tile in the sheet looks like a missing frame.
const columns = frames.length <= 2 ? 1 : frames.length <= 4 ? 2 : 3;
const rows = Math.ceil(frames.length / columns);
const sheet = join(base, "contact-sheet.jpg");
ffmpeg([
  "-framerate", "1", "-i", join(build, "frame-%02d.png"),
  "-filter_complex", `scale=640:-1,tile=${columns}x${rows}:padding=8:color=white`,
  "-frames:v", "1", "-update", "1", "-q:v", "3", sheet,
]);

console.log(`${basename(output)} · ${frames.length} slides · ${output}`);
console.log(`${basename(sheet)} · ${columns}x${rows} · ${sheet}`);
