// 质检报告：稿件校验 + 最新成片的同步/音量/时长/解码检查。
// 用法：npm run qa -- <期id> [--fast]   （--fast 跳过全片解码，省约 30 秒）
// 结果写到 runs/<id>/qa.json；有 ✗ 项时退出码为 1。
import fs from "node:fs/promises";
import path from "node:path";
import { episodeDir, exists, readJson, run, writeJson } from "./lib.mjs";
import { validateEpisode } from "./schema.mjs";

const id = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!id) throw new Error("用法：npm run qa -- <episode-id>");
const fast = process.argv.includes("--fast");
const dir = episodeDir(id);
const report = { id, at: new Date().toISOString(), checks: [] };
const add = (name, status, detail) => report.checks.push({ name, status, detail });

// 1. 稿件
const ep = await readJson(path.join(dir, "episode.json"));
const facts = await readJson(path.join(dir, "sources/facts.json")).catch(() => []);
const { errors, warnings } = await validateEpisode(ep, dir, facts);
add("稿件格式与引用", errors.length ? "fail" : warnings.length ? "warn" : "ok", [...errors, ...warnings]);
const cues = [...ep.intro.cues, ...ep.chapters.flatMap((c) => c.cues), ...ep.outro.cues];
const cited = new Set(cues.flatMap((c) => c.evidence ?? []));
add("事实覆盖", "ok", [`${facts.length} 条事实，稿件引用 ${cited.size} 条；${cues.filter((c) => c.evidence?.length).length}/${cues.length} 句带 evidence`]);

// 2. 最新成片
const renders = (await fs.readdir("out").catch(() => [])).filter((d) => d.startsWith(`${id}-render-`)).sort();
const latest = renders.at(-1) && path.join("out", renders.at(-1));
if (!latest || !(await exists(path.join(latest, "video.mp4")))) {
  add("成片", "warn", ["还没有成片：npm run render -- " + id]);
} else {
  const video = path.join(latest, "video.mp4");
  report.video = video;
  const probe = JSON.parse(
    (await run("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,width,height", "-of", "json", video])).stdout,
  );
  const dur = Number(probe.format.duration);
  const v = probe.streams.find((s) => s.codec_type === "video");
  const hasAudio = probe.streams.some((s) => s.codec_type === "audio");
  add("编码", v?.width === 1920 && v?.height === 1080 && hasAudio ? "ok" : "fail", [`${v?.codec_name} ${v?.width}×${v?.height}，音轨 ${hasAudio ? "有" : "无"}，${dur.toFixed(1)}s`]);

  const cat = await readJson(path.join("categories", ep.category ?? "ai-model-launch", "category.json")).catch(() => null);
  if (cat?.targetSeconds) {
    const [lo, hi] = cat.targetSeconds;
    add("时长", dur >= lo && dur <= hi ? "ok" : "warn", [`${(dur / 60).toFixed(1)} 分钟，类目建议 ${lo / 60}–${hi / 60} 分钟`]);
  }

  // 音量 + 声音起点
  const { stderr } = await run("ffmpeg", ["-hide_banner", "-i", video, "-vn", "-af", "volumedetect,silencedetect=noise=-40dB:d=0.12", "-f", "null", "-"], {
    maxBuffer: 64 * 1024 * 1024,
  });
  const mean = Number(stderr.match(/mean_volume: (-?[\d.]+)/)?.[1]);
  const max = Number(stderr.match(/max_volume: (-?[\d.]+)/)?.[1]);
  add("音量", mean >= -24 && mean <= -14 && max <= -0.5 ? "ok" : "fail", [`平均 ${mean}dB，峰值 ${max}dB（目标平均 -24～-14dB，峰值不削波）`]);

  const starts = [0, ...[...stderr.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]))];
  const srt = await fs.readFile(path.join(latest, "subtitles.srt"), "utf8").catch(() => "");
  const toSec = (s) => {
    const [h, m, r] = s.split(":");
    const [sec, ms] = r.split(",");
    return +h * 3600 + +m * 60 + +sec + +ms / 1000;
  };
  const subs = [...srt.matchAll(/(\d\d:\d\d:\d\d,\d\d\d) -->/g)].map((m) => toSec(m[1]));
  const diffs = subs
    .map((s) => starts.reduce((best, x) => (Math.abs(x - s) < Math.abs(best - s) ? x : best), Infinity) - s)
    .filter((d) => Math.abs(d) < 0.5)
    .sort((a, b) => a - b);
  if (diffs.length) {
    const med = diffs[Math.floor(diffs.length / 2)] * 1000;
    add("字幕同步", Math.abs(med) <= 120 ? "ok" : "fail", [
      `匹配 ${diffs.length}/${subs.length} 句，声音相对字幕中位数 ${med.toFixed(0)}ms，范围 ${(diffs[0] * 1000).toFixed(0)}～${(diffs.at(-1) * 1000).toFixed(0)}ms`,
    ]);
  } else add("字幕同步", "warn", ["没有匹配到声音起点"]);

  if (!fast) {
    const dec = await run("ffmpeg", ["-v", "error", "-i", video, "-f", "null", "-"], { maxBuffer: 64 * 1024 * 1024 }).then(
      (r) => r.stderr.trim(),
      (e) => String(e.stderr || e.message),
    );
    add("全片解码", dec ? "fail" : "ok", [dec ? dec.slice(0, 300) : "无解码错误"]);
  }
}

add("人工项", "warn", ["完整试听（读音、英文名念法、语气）只能人工确认，报告不代表已试听", "看 npm run stills 的检查帧：遮挡、高亮位置、表格可读性"]);

await writeJson(path.join(dir, "qa.json"), report);
const icon = { ok: "✓", warn: "△", fail: "✗" };
console.log(`\n质检：${id}${report.video ? `（${report.video}）` : ""}\n`);
for (const c of report.checks) {
  console.log(`${icon[c.status]} ${c.name}`);
  for (const d of c.detail.slice(0, 12)) console.log(`    ${d}`);
  if (c.detail.length > 12) console.log(`    …另有 ${c.detail.length - 12} 条，见 qa.json`);
}
console.log("");
process.exitCode = report.checks.some((c) => c.status === "fail") ? 1 : 0;
