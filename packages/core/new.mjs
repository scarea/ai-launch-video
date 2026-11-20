// 新建一期：npm run new -- <期id>
import fs from "node:fs/promises";
import path from "node:path";
import { exists, writeJson } from "./lib.mjs";

const id = process.argv[2];
if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error("用法：npm run new -- <期id>（小写字母、数字、短横线，如 gpt-6-2）");
const dir = path.resolve("runs", id);
if (await exists(path.join(dir, "episode.json"))) throw new Error(`runs/${id}/episode.json 已存在，不覆盖`);
for (const d of ["sources/text", "sources/figures"]) await fs.mkdir(path.join(dir, d), { recursive: true });
const today = new Date().toISOString().slice(0, 10).replaceAll("-", ".");
await writeJson(path.join(dir, "sources/facts.json"), []);
await writeJson(path.join(dir, "sources/manifest.json"), []);
await writeJson(path.join(dir, "episode.json"), {
  id,
  category: "ai-model-launch",
  date: today,
  vendor: { name: "厂商名", short: "首字母", accent: "#3B5BDB" },
  title: ["模型名", "全面拆解"],
  subtitle: "一句话说明这期讲什么",
  highlights: [],
  intro: { cues: [{ text: "开场第一句", pose: "point" }] },
  chapters: [
    {
      id: "release",
      title: "发布与开放",
      accent: "副标题",
      source: "官方发布公告",
      cues: [{ text: "第一章第一句", visual: { kind: "points", heading: "要点", items: ["要点一", "要点二"] } }],
    },
  ],
  outro: { title: "首发拆解", accent: "我们下期见", cues: [{ text: "我们下期见" }] },
});
console.log(`已创建 runs/${id}/
  下一步：按 skills/launch-video/references/research.md 填 sources/，再按 script.md 写 episode.json`);
