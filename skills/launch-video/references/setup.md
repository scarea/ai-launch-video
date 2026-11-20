# 配置与降级规则

`npm run doctor -- --online` 会逐项检查。下面说明每项的作用、谁来提供、缺了会怎样。

| 项 | 必需 | 谁提供 | 缺了会怎样 |
|---|---|---|---|
| Node.js 22+ | 是 | 用户安装 | 无法运行 |
| `npm install` | 是 | Agent 执行 | 无法运行 |
| FFmpeg / ffprobe | 是 | 用户安装（`brew install ffmpeg`） | 无法裁剪配音、测时长、质检 |
| `.venv`（edge-tts、pillow、numpy） | 是 | Agent 执行：`uv venv .venv --python 3.12 && uv pip install --python .venv/bin/python edge-tts pillow numpy` | 无法免费配音、抠图、定位坐标 |
| 渲染浏览器 | 自动 | Remotion 首次渲染自动下载 | — |
| `MINIMAX_API_KEY` | 否 | **用户提供**，写进 `.env` | 自动降级为 edge-tts 免费配音（语气偏平） |
| 主播立绘 PNG | 否 | 用户提供或用生图工具制作（见 avatar.md） | 用内置 SVG 占位形象 |
| 生图工具 | 否 | 用户自己的任意生图服务 | 只影响制作新立绘 |

## .env（不要提交，不要在日志里打印）

```
MINIMAX_API_KEY=            # MiniMax 控制台获取
MINIMAX_BASE=https://api.minimaxi.com   # 国内站；国际站为 https://api.minimax.io，key 不通用
MINIMAX_MODEL=speech-2.8-hd
MINIMAX_MIN_INTERVAL_MS=3500            # 免费额度有每分钟请求数限制，串行 + 间隔
```

用户在聊天里贴 key 时：写进 `.env`，回复里不要复述 key。

## brand/brand.json

```json
{
  "name": "栏目名",
  "tagline": "副标题",
  "ink": "#14192B",
  "primary": "#3B5BDB",
  "avatar": { "type": "png", "poses": { "idle": "brand/avatar/host-idle.png", "idleTalk": "brand/avatar/host-idleTalk.png", "point": "...", "pointTalk": "...", "think": "..." } },
  "voice": { "provider": "minimax", "voice": "Chinese (Mandarin)_Warm_Bestie", "speed": 1.1 },
  "voiceFallback": { "provider": "edge", "voice": "zh-CN-XiaoxiaoNeural", "rate": "+12%" }
}
```

- `poses` 的值是相对仓库根目录的文件路径；assemble 会原样复制到 `public/` 下
- `avatar` 改成 `{ "type": "svg" }` 就用内置占位形象
- 某一期想换声音：在 episode.json 顶层写 `"voice": {...}` 覆盖
- 换音色前先试听：用 `packages/providers/tts/minimax.mjs` 的 `synth()` 对同一句话合成几个候选给用户选；MiniMax 系统音色列表用 `POST {base}/v1/get_voice {"voice_type":"system"}` 获取
