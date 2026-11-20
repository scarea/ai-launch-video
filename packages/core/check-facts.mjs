// 核对 facts.json：每条 exact 必须能在 sources/text/*.md 里找到（或给了存在的 dataFile），字段合法、id 不重复。
// 用法：npm run check-facts -- <期id>
import fs from "node:fs/promises";
import path from "node:path";
import { episodeDir, exists, readJson } from "./lib.mjs";

const id = process.argv[2];
if (!id) throw new Error("用法：npm run check-facts -- <期id>");
const dir = path.join(episodeDir(id), "sources");
const facts = await readJson(path.join(dir, "facts.json"));
const TOPICS = ["release", "availability", "benchmarks", "comparison", "capabilities", "examples", "safety", "pricing", "context", "other"];
const CONF = ["official", "third-party", "unverified"];

// 统一 Unicode 连字符、引号、空白，避免 U+2011 / 弯引号 / 不换行空格导致对不上
const norm = (s) =>
  s
    .normalize("NFKC")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // markdown 链接/图片只保留文字
    .replace(/\|/g, " ") // 表格竖线
    .replace(/[‐-―−]/g, "-")
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”‟″]/g, '"')
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

const textDir = path.join(dir, "text");
const corpus = (await exists(textDir))
  ? norm((await Promise.all((await fs.readdir(textDir)).filter((f) => f.endsWith(".md")).map((f) => fs.readFile(path.join(textDir, f), "utf8")))).join("\n"))
  : "";

const problems = [];
const seen = new Set();
for (const f of facts) {
  const at = `${f.id ?? "?"}`;
  if (!f.id || seen.has(f.id)) problems.push(`${at}：id 缺失或重复`);
  seen.add(f.id);
  if (!TOPICS.includes(f.topic)) problems.push(`${at}：topic 应为 ${TOPICS.join("/")}`);
  if (!CONF.includes(f.confidence)) problems.push(`${at}：confidence 应为 ${CONF.join("/")}`);
  if (!f.claim) problems.push(`${at}：claim 必填`);
  if (!f.url) problems.push(`${at}：url 必填`);
  if (f.dataFile) {
    if (!(await exists(path.join(dir, f.dataFile)))) problems.push(`${at}：dataFile ${f.dataFile} 不存在`);
  } else if (f.confidence !== "unverified") {
    if (!f.exact) problems.push(`${at}：exact 必填（数字只在图表数据里时改填 dataFile）`);
    else if (f.exact.split(/\s+/).length > 25) problems.push(`${at}：exact 超过 25 词`);
    else if (!corpus.includes(norm(f.exact))) problems.push(`${at}：exact 在 text/ 里找不到「${f.exact.slice(0, 50)}」`);
  }
}
console.log(`facts=${facts.length}，问题 ${problems.length} 条`);
for (const p of problems) console.log("  " + p);
process.exitCode = problems.length ? 1 : 0;
