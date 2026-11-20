// episode.json + 配音清单 → public/ep/timeline.json（Remotion 读取）。用法：npm run assemble -- fable-5-2
import path from "node:path";
import fs from "node:fs/promises";
import { episodeDir, readJson, run, sha, writeJson } from "./lib.mjs";

async function aspectOf(file) {
  const { stdout } = await run("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", file]);
  const [w, h] = stdout.trim().split(",").map(Number);
  return w / h;
}

const id = process.argv[2];
if (!id) throw new Error("用法：npm run assemble -- <episode-id>");
const FPS = 30;
const dir = episodeDir(id);
const ep = await readJson(path.join(dir, "episode.json"));
const brand = await readJson("brand/brand.json");
const { voice, cues: audio } = await readJson(path.join(dir, "audio", "manifest.json"));
const pub = path.resolve("public", "ep");
await fs.rm(pub, { recursive: true, force: true });
await fs.mkdir(path.join(pub, "audio"), { recursive: true });
await fs.mkdir(path.join(pub, "media"), { recursive: true });
// 品牌立绘 → public/brand/
await fs.mkdir(path.resolve("public", "brand"), { recursive: true });
if (brand.avatar.type === "png")
  for (const f of new Set(Object.values(brand.avatar.poses)))
    await fs.copyFile(path.resolve("brand", "avatar", path.basename(f)), path.resolve("public", f));

const copied = new Map();
async function media(src) {
  if (copied.has(src)) return copied.get(src);
  const from = path.join(dir, src);
  const name = `${sha(src)}${path.extname(src)}`;
  await fs.copyFile(from, path.join(pub, "media", name));
  copied.set(src, `ep/media/${name}`);
  return `ep/media/${name}`;
}

// evidence 引用必须存在于 facts.json
const factsPath = path.join(dir, "sources", "facts.json");
const factIds = new Set((await readJson(factsPath).catch(() => [])).map((f) => f.id));
const unknown = [];
for (const c of [...ep.intro.cues, ...ep.chapters.flatMap((c) => c.cues), ...ep.outro.cues])
  for (const e of c.evidence ?? []) if (!factIds.has(e)) unknown.push(`${e}：${c.text}`);
if (unknown.length) throw new Error("evidence 引用不存在：\n" + unknown.join("\n"));

const LEAD = { intro: 24, chapter: 14, outro: 10 };
let cursor = 0;
const scenes = [];
const problems = [];

async function scene(kind, sid, title, accent, cues, defaults = {}) {
  const from = cursor;
  cursor += LEAD[kind];
  let visual = defaults.visual ?? { kind: "points", items: [title] };
  let side = {};
  let pose = kind === "intro" ? "point" : "idle";
  let source = defaults.source;
  const timed = [];
  for (const c of cues) {
    const key = sha(JSON.stringify([voice.provider, voice.params, c.emotion ?? null, c.text]));
    const a = audio[key];
    if (!a) throw new Error(`缺少配音：${c.text}（先跑 npm run tts）`);
    if ([...c.text].length > 40) problems.push(`字幕过长(${[...c.text].length}字)：${c.text}`);
    if (c.visual) {
      visual = { ...c.visual };
      if (visual.kind === "image" || visual.kind === "video") {
        visual.aspect ??= await aspectOf(path.join(dir, visual.src));
        visual.src = await media(visual.src);
      }
    }
    if (c.side) side = { ...side, ...c.side };
    if (c.pose) pose = c.pose;
    if (c.source) source = c.source;
    await fs.copyFile(path.join(dir, a.file), path.join(pub, "audio", path.basename(a.file)));
    const speechFrames = Math.ceil(a.seconds * FPS);
    const pause = Math.round(((c.pauseMs ?? 320) / 1000) * FPS);
    timed.push({
      text: c.text,
      audio: `ep/audio/${path.basename(a.file)}`,
      from: cursor,
      speechFrames,
      frames: speechFrames + pause,
      visual,
      visualKey: sha(JSON.stringify(visual)),
      side,
      pose,
      source,
    });
    cursor += speechFrames + pause;
  }
  // 章节内视觉序号
  const keys = [...new Set(timed.map((t) => t.visualKey))];
  timed.forEach((t) => {
    t.visualIndex = keys.indexOf(t.visualKey);
    t.visualCount = keys.length;
  });
  if (timed.length) timed[0].from = from + LEAD[kind];
  scenes.push({ kind, id: sid, title, accent, from, frames: cursor - from, cues: timed });
}

await scene("intro", "intro", ep.title.join(" "), undefined, ep.intro.cues);
for (const ch of ep.chapters) await scene("chapter", ch.id, ch.title, ch.accent, ch.cues, { source: ch.source });
cursor += 0;
await scene("outro", "outro", ep.outro.title, ep.outro.accent, ep.outro.cues);
cursor += 30; // 结尾留白

const timeline = {
  fps: FPS,
  width: 1920,
  height: 1080,
  totalFrames: cursor,
  brand: { name: brand.name, tagline: brand.tagline, avatar: brand.avatar, ink: brand.ink, primary: brand.primary },
  vendor: ep.vendor,
  date: ep.date,
  title: ep.title,
  subtitle: ep.subtitle,
  highlights: ep.highlights,
  scenes,
};
await writeJson(path.join(pub, "timeline.json"), timeline);
await writeJson(path.join(dir, "timeline.json"), timeline);

// SRT 字幕
const ts = (f) => {
  const ms = Math.round((f / FPS) * 1000);
  const p = (n, l = 2) => String(n).padStart(l, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
const srt = scenes
  .flatMap((s) => s.cues)
  .map((c, i) => `${i + 1}\n${ts(c.from)} --> ${ts(c.from + c.speechFrames)}\n${c.text}\n`)
  .join("\n");
await fs.writeFile(path.join(dir, "subtitles.srt"), srt);

console.log(`scenes=${scenes.length} 时长=${(cursor / FPS).toFixed(1)}s`);
for (const s of scenes) console.log(`  ${(s.from / FPS).toFixed(1).padStart(6)}s  ${s.title}${s.accent ? "，" + s.accent : ""}`);
if (problems.length) console.log("提醒：\n  " + problems.join("\n  "));
