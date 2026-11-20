// 逐句合成配音 → 裁掉首尾静音 → 记录真实时长。用法：npm run tts -- <期id> [--only=intro]
// 缓存 key = 服务商 + 合成参数 + 情绪 + 文本；改稿只重做改动的句子。
import path from "node:path";
import fs from "node:fs/promises";
import { allCues, duration, episodeDir, exists, readJson, run, sha, writeJson } from "./lib.mjs";

const id = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!id) throw new Error("用法：npm run tts -- <episode-id>");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const dir = episodeDir(id);
const ep = await readJson(path.join(dir, "episode.json"));
const brand = await readJson("brand/brand.json");
let voice = { ...brand.voice, ...(ep.voice ?? {}) };
if (voice.provider === "minimax" && !process.env.MINIMAX_API_KEY) {
  if (!brand.voiceFallback) throw new Error("没有 MINIMAX_API_KEY，也没有 brand.voiceFallback");
  console.log(`没有 MINIMAX_API_KEY，降级为 ${brand.voiceFallback.provider} 免费配音（npm run doctor 查看配置）`);
  voice = { ...brand.voiceFallback };
}
const provider = await import(`../providers/tts/${voice.provider}.mjs`);
const params = provider.settings(voice);

export const cueKey = (cue) => sha(JSON.stringify([voice.provider, params, cue.emotion ?? null, cue.text]));

await fs.mkdir(path.join(dir, "audio"), { recursive: true });
const manifestPath = path.join(dir, "audio", "manifest.json");
const old = (await exists(manifestPath)) ? (await readJson(manifestPath)).cues : {};
const manifest = {};
const items = allCues(ep).filter((x) => !only || x.sceneId === only);
let made = 0;
const queue = [...items];
let lastCall = 0;
async function throttle() {
  const gap = provider.minIntervalMs ?? 0;
  const wait = lastCall + gap - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}

// 首尾静音裁掉，只留 40ms / 80ms，字幕与声音起点对齐，停顿完全由 pauseMs 控制
const TRIM =
  "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.04," +
  "areverse,silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.08,areverse," +
  // 逐句响度标准化，不同服务商/音色的音量统一到约 -16 LUFS
  "loudnorm=I=-16:TP=-1.5:LRA=7";
const POST_VERSION = "n1"; // 改了后处理就换版本号，已缓存的原始音频会重新处理

async function worker() {
  while (queue.length) {
    const { cue } = queue.shift();
    const key = cueKey(cue);
    const raw = path.join(dir, "audio", `${key}.raw.${provider.ext}`);
    const file = path.join(dir, "audio", `${key}.${POST_VERSION}.wav`);
    if (!(await exists(raw))) {
      for (let attempt = 1; ; attempt++) {
        try {
          await throttle();
          await provider.synth({ text: cue.text, voice, emotion: cue.emotion, out: raw });
          break;
        } catch (e) {
          const limited = provider.isRateLimit?.(e);
          if (attempt >= (limited ? 10 : 3)) throw e;
          const wait = limited ? 15000 * Math.min(attempt, 4) : 2000 * attempt;
          console.log(`  ${limited ? "限流" : "失败"}，${wait / 1000}s 后重试：${cue.text.slice(0, 16)}…`);
          await new Promise((r) => setTimeout(r, wait));
        }
      }
      process.stdout.write(`\r  已合成 ${made + 1}`);
      made++;
    }
    if (!(await exists(file))) {
      await run("ffmpeg", ["-v", "error", "-y", "-i", raw, "-af", TRIM, "-ar", "48000", "-ac", "1", file]);
    }
    manifest[key] = { file: path.relative(dir, file), seconds: await duration(file), text: cue.text };
  }
}
await Promise.all(Array.from({ length: provider.concurrency ?? 4 }, worker));
process.stdout.write("\n");
await writeJson(manifestPath, { voice: { ...voice, params }, cues: { ...(only ? old : {}), ...manifest } });
const total = Object.values(manifest).reduce((s, m) => s + m.seconds, 0);
console.log(`provider=${voice.provider} cues=${items.length} 新合成=${made} 语音总长=${total.toFixed(1)}s`);
