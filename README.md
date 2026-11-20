# 首发拆解 · ai-launch-video

AI 新模型发布 → 5–7 分钟中文讲解视频。画面用 Remotion（React 代码绘制动效）渲染，配音默认用免费的 edge-tts。

## 一次性准备
```bash
npm install
uv venv .venv --python 3.12 && uv pip install --python .venv/bin/python edge-tts pillow numpy
```

## 做一期
1. 资料包：`runs/<id>/sources/`（facts.json、figures/、text/）
2. 稿件与画面计划：`runs/<id>/episode.json`（格式见 `skills/launch-video/SKILL.md`）
3. 制作：
```bash
npm run tts -- <id>
npm run assemble -- <id>
npm run stills -- <id>      # 检查帧
npm run render -- <id>      # 成片 + 字幕
npm run studio              # 浏览器实时预览
```

## 形象
`brand/avatar/host-*.png`，绿幕图用 `.venv/bin/python -I packages/core/cutout.py brand/avatar <图片...>` 抠图（同一外接框裁切，保证张嘴/闭嘴对齐）。

## 预留
- `packages/providers/tts/minimax.mjs`：MiniMax 配音（待实现）
- `categories/`：按类目扩展章节骨架与素材槽位
- 后续：Web 管理端、MCP server、自动监听发布、导出剪映草稿
