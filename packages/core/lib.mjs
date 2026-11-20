import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const run = promisify(execFile);
export const readJson = async (p) => JSON.parse(await fs.readFile(p, "utf8"));
export const writeJson = async (p, v) => {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(v, null, 2) + "\n");
};
export const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);
export const exists = (p) => fs.access(p).then(() => true, () => false);

export const episodeDir = (id) => path.resolve("runs", id);

/** 按 intro → chapters → outro 顺序遍历全部 cue */
export function allCues(ep) {
  const out = [];
  const push = (sceneId, cues) => cues?.forEach((c, i) => out.push({ sceneId, index: i, cue: c }));
  push("intro", ep.intro?.cues);
  ep.chapters.forEach((ch) => push(ch.id, ch.cues));
  push("outro", ep.outro?.cues);
  return out;
}

export async function duration(file) {
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  return Number(stdout.trim());
}

export function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
}
