// 免费 TTS：Microsoft Edge 在线朗读（edge-tts）。个人项目使用，非官方 API，可能随时变化。
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const run = promisify(execFile);
const BIN = path.resolve(".venv/bin/edge-tts");

export const name = "edge";
export const ext = "mp3";

export function settings(voice) {
  return { voice: voice.voice, rate: voice.rate ?? "+0%" };
}

export async function synth({ text, voice, out }) {
  const env = { ...process.env };
  // 本机代理失效时直连
  for (const k of ["HTTPS_PROXY", "HTTP_PROXY", "https_proxy", "http_proxy"]) delete env[k];
  const s = settings(voice);
  await run(BIN, ["--voice", s.voice, `--rate=${s.rate}`, "--text", text, "--write-media", out], { env });
}
