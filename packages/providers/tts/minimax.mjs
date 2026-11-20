// MiniMax 同步 TTS（t2a_v2）。国内站 https://api.minimaxi.com，国际站 https://api.minimax.io
// 需要 .env：MINIMAX_API_KEY，可选 MINIMAX_BASE、MINIMAX_MODEL
import fs from "node:fs/promises";

export const name = "minimax";
export const ext = "mp3";
/** 免费额度有 RPM 限制：串行 + 最小请求间隔 */
export const concurrency = 1;
export const minIntervalMs = Number(process.env.MINIMAX_MIN_INTERVAL_MS ?? 3500);
export const isRateLimit = (e) => /code=1002|rate limit/i.test(String(e?.message));

export function settings(voice) {
  return {
    model: voice.model ?? process.env.MINIMAX_MODEL ?? "speech-2.8-hd",
    voice_id: voice.voice,
    speed: voice.speed ?? 1.1,
    vol: voice.vol ?? 1,
    pitch: voice.pitch ?? 0,
  };
}

export async function synth({ text, voice, emotion, out }) {
  const key = process.env.MINIMAX_API_KEY;
  if (!key) throw new Error("缺少 MINIMAX_API_KEY（写在项目根目录 .env）");
  const base = process.env.MINIMAX_BASE ?? "https://api.minimaxi.com";
  const s = settings(voice);
  const body = {
    model: s.model,
    text,
    stream: false,
    language_boost: "Chinese",
    voice_setting: { voice_id: s.voice_id, speed: s.speed, vol: s.vol, pitch: s.pitch, ...(emotion ? { emotion } : {}) },
    audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
  };
  const res = await fetch(`${base}/v1/t2a_v2`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  const code = json?.base_resp?.status_code;
  if (!res.ok || code !== 0 || !json?.data?.audio) {
    throw new Error(`MiniMax 失败 http=${res.status} code=${code} msg=${json?.base_resp?.status_msg} trace=${json?.trace_id}`);
  }
  await fs.writeFile(out, Buffer.from(json.data.audio, "hex"));
}
