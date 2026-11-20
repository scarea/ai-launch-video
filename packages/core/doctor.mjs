// 环境与配置体检：告诉用户缺什么、怎么配、当前配置能做出什么。
// 用法：npm run doctor            只查本机
//       npm run doctor -- --online 额外测试网络与 API key（会发一次查询请求，不产生合成费用）
import fs from "node:fs/promises";
import path from "node:path";
import { exists, readJson, run } from "./lib.mjs";

const online = process.argv.includes("--online");
const rows = []; // {area, status: ok|warn|miss, msg, fix?}
const add = (area, status, msg, fix) => rows.push({ area, status, msg, fix });
const has = async (cmd, args = ["-version"]) => run(cmd, args).then(() => true, () => false);

// ---- 基础依赖 ----
const nodeMajor = Number(process.versions.node.split(".")[0]);
add("Node.js", nodeMajor >= 22 ? "ok" : "miss", `v${process.versions.node}`, nodeMajor >= 22 ? undefined : "安装 Node.js 22+");
add(
  "npm 依赖",
  (await exists("node_modules/remotion")) ? "ok" : "miss",
  (await exists("node_modules/remotion")) ? "Remotion 已安装" : "未安装",
  "npm install",
);
add("FFmpeg", (await has("ffmpeg")) && (await has("ffprobe")) ? "ok" : "miss", "配音裁剪、时长测量、成片检查都要用", "macOS: brew install ffmpeg");

const py = ".venv/bin/python";
const venv = await exists(py);
const pyMods = venv
  ? await run(py, ["-I", "-c", "import PIL, numpy; print('ok')"]).then(() => true, () => false)
  : false;
const edge = await exists(".venv/bin/edge-tts");
add(
  "Python 环境",
  venv && pyMods && edge ? "ok" : "miss",
  venv ? `edge-tts ${edge ? "✓" : "✗"}，pillow/numpy ${pyMods ? "✓" : "✗"}` : "没有 .venv",
  "uv venv .venv --python 3.12 && uv pip install --python .venv/bin/python edge-tts pillow numpy",
);
add("渲染浏览器", "ok", "Remotion 首次渲染会自动下载 Chrome Headless Shell（约 140MB）");

// ---- 配置 ----
const brand = await readJson("brand/brand.json").catch(() => null);
if (!brand) add("品牌配置", "miss", "brand/brand.json 不存在", "参照 skills/launch-video/references/setup.md 新建");
else add("品牌配置", "ok", `栏目「${brand.name}」`);

const envKeys = {};
if (await exists(".env")) {
  for (const line of (await fs.readFile(".env", "utf8")).split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) envKeys[m[1]] = m[2].trim();
  }
}
const mmKey = !!(process.env.MINIMAX_API_KEY || envKeys.MINIMAX_API_KEY);
const voice = brand?.voice ?? {};
if (voice.provider === "minimax") {
  if (mmKey) add("配音", "ok", `MiniMax「${voice.voice}」，语速 ${voice.speed ?? 1.1}`);
  else
    add(
      "配音",
      "warn",
      `brand.json 指定 MiniMax，但没有 MINIMAX_API_KEY → 自动降级为 ${brand?.voiceFallback?.provider ?? "edge"} 免费配音`,
      "在项目根目录 .env 写 MINIMAX_API_KEY=...（国内站 key 配 MINIMAX_BASE=https://api.minimaxi.com）",
    );
} else {
  add("配音", edge ? "ok" : "miss", `edge-tts 免费配音「${voice.voice ?? "zh-CN-XiaoxiaoNeural"}」，语气偏平`, mmKey ? undefined : "可选：配置 MiniMax 获得更自然的配音");
}

const avatar = brand?.avatar;
if (avatar?.type === "png") {
  const missing = [];
  for (const f of Object.values(avatar.poses ?? {})) if (!(await exists(f))) missing.push(f);
  add(
    "主播立绘",
    missing.length ? "miss" : "ok",
    missing.length ? `缺少 ${missing.join(", ")}` : `${Object.keys(avatar.poses).length} 张（含说话口型）`,
    missing.length ? "见 references/avatar.md；或把 brand.json 的 avatar 改成 {\"type\":\"svg\"} 用占位形象" : undefined,
  );
} else add("主播立绘", "warn", "使用内置 SVG 占位形象", "想换成自己的立绘：见 references/avatar.md");

add("生图工具", "warn", "本仓库不内置生图服务；只有制作新立绘时才需要（任意能出绿幕图的模型都行）");

// ---- 网络 ----
const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (online) {
  const probe = async (url, viaProxy) =>
    run("curl", ["-sS", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "10", ...(viaProxy ? [] : ["--noproxy", "*"]), url]).then(
      (r) => r.stdout.trim(),
      () => "失败",
    );
  const direct = await probe("https://www.anthropic.com", false);
  const viaProxy = proxy ? await probe("https://www.anthropic.com", true) : "未设置";
  add(
    "网络",
    direct !== "失败" || viaProxy !== "失败" ? "ok" : "miss",
    `直连 ${direct}，经代理 ${viaProxy}`,
    proxy && viaProxy === "失败" && direct !== "失败" ? "代理失效：联网命令用 --noproxy '*' 或 env -u HTTPS_PROXY -u HTTP_PROXY" : undefined,
  );
  if (mmKey) {
    const base = process.env.MINIMAX_BASE || envKeys.MINIMAX_BASE || "https://api.minimaxi.com";
    const key = process.env.MINIMAX_API_KEY || envKeys.MINIMAX_API_KEY;
    const r = await run("curl", [
      "-sS", "--noproxy", "*", "--max-time", "15", "-X", "POST", `${base}/v1/get_voice`,
      "-H", `Authorization: Bearer ${key}`, "-H", "Content-Type: application/json", "-d", '{"voice_type":"system"}',
    ]).then((x) => x.stdout, () => "");
    const ok = /"status_code":0/.test(r);
    add("MiniMax key", ok ? "ok" : "miss", ok ? `${base} 可用` : `${base} 校验失败`, ok ? undefined : "检查 key 是否属于该站点（国内 api.minimaxi.com / 国际 api.minimax.io）");
  }
} else if (proxy) {
  add("网络", "warn", "检测到 HTTP(S)_PROXY；如果联网报 SSL_ERROR_SYSCALL，多半是代理失效", "npm run doctor -- --online 实测");
}

// ---- 已有的期 ----
const episodes = [];
for (const id of (await fs.readdir("runs").catch(() => [])).filter((d) => !d.startsWith("_"))) {
  const d = path.join("runs", id);
  const st = {
    资料包: await exists(path.join(d, "sources/facts.json")),
    稿件: await exists(path.join(d, "episode.json")),
    配音: await exists(path.join(d, "audio/manifest.json")),
    成片: (await fs.readdir("out").catch(() => [])).some((o) => o.startsWith(`${id}-render-`)),
  };
  episodes.push(`${id}：${Object.entries(st).map(([k, v]) => `${k}${v ? "✓" : "✗"}`).join(" ")}`);
}

// ---- 输出 ----
const icon = { ok: "✓", warn: "△", miss: "✗" };
const pad = (str, w) => str + " ".repeat(Math.max(1, w - [...str].reduce((n, c) => n + (c.charCodeAt(0) > 255 ? 2 : 1), 0)));
console.log("\n首发拆解 · 环境体检\n");
for (const r of rows) {
  console.log(`${icon[r.status]} ${pad(r.area, 13)}${r.msg}`);
  if (r.fix && r.status !== "ok") console.log(`    → ${r.fix}`);
}
const blocking = rows.filter((r) => r.status === "miss");
console.log("\n能做出什么：");
if (blocking.length) {
  console.log(`  还不能出片，先解决 ✗ 项：${blocking.map((r) => r.area).join("、")}`);
} else {
  const v = voice.provider === "minimax" && mmKey ? "MiniMax 自然配音" : "edge-tts 免费配音";
  const a = avatar?.type === "png" ? "自己的主播立绘" : "SVG 占位形象";
  console.log(`  1920×1080 讲解视频 + SRT 字幕：${v}，${a}，官方图表推近高亮、代码绘制的柱状图/表格/指标卡`);
  console.log("  一期典型耗时：资料包 10–15 分钟，写稿 10 分钟，配音 1–6 分钟，渲染约 5 分钟（M 系列 Mac）");
}
if (episodes.length) console.log(`\n已有的期：\n  ${episodes.join("\n  ")}`);
console.log("");
process.exitCode = blocking.length ? 1 : 0;
