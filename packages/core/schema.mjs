// episode.json 校验：不依赖第三方库，返回 {errors, warnings}，每条都带位置，方便 Agent 直接修。
import path from "node:path";
import { exists } from "./lib.mjs";

const VISUALS = {
  image: ["src"],
  video: ["src"],
  points: ["items"],
  quote: ["text"],
  stat: ["value", "label"],
  bars: ["title", "items"],
  table: ["columns", "rows"],
};
const POSES = ["idle", "point", "think"];
const rect = (r) => Array.isArray(r) && r.length === 4 && r.every((n) => typeof n === "number" && n >= 0 && n <= 1) && r[0] + r[2] <= 1.001 && r[1] + r[3] <= 1.001;
const len = (s) => [...s].length;

export async function validateEpisode(ep, dir, facts = []) {
  const errors = [];
  const warnings = [];
  const factMap = new Map(facts.map((f) => [f.id, f]));
  const need = (cond, where, msg) => cond || errors.push(`${where}：${msg}`);

  need(typeof ep.id === "string", "id", "必填字符串");
  need(typeof ep.date === "string", "date", "必填，如 2026.11.20");
  need(ep.vendor && ep.vendor.name && ep.vendor.short && /^#[0-9a-fA-F]{6}$/.test(ep.vendor.accent ?? ""), "vendor", "需要 {name, short, accent:'#RRGGBB'}");
  need(Array.isArray(ep.title) && ep.title.length === 2, "title", "两段数组，如 ['GPT-6.2', '全面拆解']");
  need(Array.isArray(ep.highlights) && ep.highlights.length <= 3, "highlights", "最多 3 个 {tag, title}");
  need(Array.isArray(ep.intro?.cues) && ep.intro.cues.length > 0, "intro.cues", "开场至少一句");
  need(Array.isArray(ep.chapters) && ep.chapters.length > 0, "chapters", "至少一章");
  need(ep.outro && typeof ep.outro.title === "string" && Array.isArray(ep.outro.cues), "outro", "需要 {title, accent?, cues}");
  if (errors.length) return { errors, warnings };

  const ids = new Set();
  const scenes = [["intro", ep.intro.cues], ...ep.chapters.map((c, i) => [`chapters[${i}](${c.id})`, c.cues, c]), ["outro", ep.outro.cues]];
  for (const [where, cues, ch] of scenes) {
    if (ch) {
      need(typeof ch.id === "string" && !ids.has(ch.id), where, "id 必填且不能重复");
      ids.add(ch.id);
      need(typeof ch.title === "string", where, "title 必填");
      if (ch.cues?.[0] && !ch.cues[0].visual) errors.push(`${where}.cues[0]：每章第一句必须给 visual`);
    }
    for (const [i, c] of (cues ?? []).entries()) {
      const at = `${where}.cues[${i}]「${String(c.text ?? "").slice(0, 14)}」`;
      if (typeof c.text !== "string" || !c.text.trim()) { errors.push(`${at}：text 必填`); continue; }
      if (len(c.text) > 34) warnings.push(`${at}：${len(c.text)} 字，超过 34 字字幕会挤（建议 12–32 字）`);
      if (/\d/.test(c.text) && !c.evidence?.length && where !== "outro") warnings.push(`${at}：含数字但没有 evidence`);
      for (const e of c.evidence ?? []) {
        const f = factMap.get(e);
        if (!f) errors.push(`${at}：evidence ${e} 不在 facts.json`);
        else if (f.confidence === "unverified") warnings.push(`${at}：引用了未核实的 ${e}`);
      }
      if (c.pauseMs !== undefined) need(c.pauseMs >= 0 && c.pauseMs <= 2000, at, "pauseMs 0–2000");
      if (c.pose) need(POSES.includes(c.pose), at, `pose 只能是 ${POSES.join("/")}`);
      const v = c.visual;
      if (v) {
        const req = VISUALS[v.kind];
        if (!req) { errors.push(`${at}：visual.kind 只能是 ${Object.keys(VISUALS).join("/")}`); continue; }
        for (const k of req) need(v[k] !== undefined, at, `${v.kind} 需要 ${k}`);
        if (v.kind === "image" || v.kind === "video") {
          if (v.src && !(await exists(path.join(dir, v.src)))) errors.push(`${at}：找不到 ${v.src}（相对 runs/${ep.id}/）`);
          if (v.focus) need(rect(v.focus), at, "focus 为 [x,y,w,h]，0–1 且不越界");
          if (v.focusFrom) need(rect(v.focusFrom), at, "focusFrom 为 [x,y,w,h]，0–1 且不越界");
          if (v.highlight) {
            const h = v.highlight;
            need(h.x >= 0 && h.x <= 1 && h.y >= 0 && h.y <= 1, at, "highlight x/y 为 0–1（相对原图）");
            const f = v.focus ?? [0, 0, 1, 1];
            if (h.x < f[0] || h.x > f[0] + f[2] || h.y < f[1] || h.y > f[1] + f[3]) warnings.push(`${at}：高亮点不在 focus 区域内，推近后会看不到`);
          }
        }
        if (v.kind === "table" && Array.isArray(v.rows))
          v.rows.forEach((r, ri) => need(r.length === v.columns.length, at, `table 第 ${ri} 行列数 ≠ columns`));
        if (v.kind === "bars") v.items?.forEach((b) => need(typeof b.value === "number", at, "bars.items[].value 必须是数字"));
      }
      if (c.side?.tabs && c.side.tabs.length > 4) warnings.push(`${at}：右侧标签超过 4 个，只显示前 4 个`);
    }
  }
  return { errors, warnings };
}
