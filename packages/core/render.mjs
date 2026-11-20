// 渲染成片或检查帧。用法：
//   npm run render -- fable-5-2            → out/<id>-<时间>/video.mp4
//   npm run stills -- fable-5-2            → 每个视觉段的中点 + 每章开头各一张
import path from "node:path";
import fs from "node:fs/promises";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { readJson } from "./lib.mjs";

const id = process.argv.slice(2).find((a) => !a.startsWith("--"));
const stillsOnly = process.argv.includes("--stills");
const onlyFrames = process.argv.find((a) => a.startsWith("--frames="))?.slice(9);
const timeline = await readJson("public/ep/timeline.json");
if (!id) throw new Error("用法：npm run render -- <期id>");
if (timeline.id !== id) throw new Error(`public/ep 里是「${timeline.id ?? "未知"}」的时间轴，不是 ${id}：先运行 npm run assemble -- ${id}`);
const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
const outDir = path.resolve("out", `${id}-${stillsOnly ? "stills" : "render"}-${stamp}`);
await fs.mkdir(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.resolve("packages/templates/src/index.ts"), publicDir: path.resolve("public") });
const inputProps = { timeline };
const composition = await selectComposition({ serveUrl, id: "LaunchVideo", inputProps });

if (stillsOnly) {
  const frames = new Map();
  if (onlyFrames) onlyFrames.split(",").forEach((f) => frames.set(Number(f), `f${f}`));
  else
    for (const s of timeline.scenes) {
      frames.set(s.from + 30, `${s.id}-start`);
      const seen = new Set();
      for (const c of s.cues) {
        if (seen.has(c.visualKey)) continue;
        seen.add(c.visualKey);
        const group = s.cues.filter((x) => x.visualKey === c.visualKey);
        const end = group.at(-1).from + group.at(-1).frames;
        frames.set(Math.floor((c.from + end) / 2), `${s.id}-v${c.visualIndex + 1}`);
      }
    }
  for (const [frame, label] of [...frames].sort((a, b) => a[0] - b[0])) {
    const file = path.join(outDir, `${String(frame).padStart(5, "0")}-${label}.jpg`);
    await renderStill({ serveUrl, composition, inputProps, frame, output: file, imageFormat: "jpeg", jpegQuality: 80 });
  }
  console.log(`stills=${frames.size} → ${outDir}`);
} else {
  const output = path.join(outDir, "video.mp4");
  let last = -1;
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    codec: "h264",
    crf: 20,
    audioBitrate: "192k",
    outputLocation: output,
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 10);
      if (p !== last) {
        last = p;
        console.log(`render ${p * 10}%`);
      }
    },
  });
  await fs.copyFile(path.resolve("runs", id, "subtitles.srt"), path.join(outDir, "subtitles.srt"));
  console.log(`done → ${output}`);
}
