# 首发拆解 · ai-launch-video

AI 新模型发布 → 5–7 分钟中文讲解视频（1920×1080 + SRT 字幕）。画面用 Remotion（React 代码绘制动效）渲染，配音支持 MiniMax 和免费的 edge-tts。

## 交给 AI 来做

把仓库交给任意 Agent（Codex、Claude Code……），说一句：

> 读 AGENTS.md，帮我做一期 <模型名> 的讲解视频

它会先跑体检，告诉你缺哪些配置、能做出什么，再按 `skills/launch-video/SKILL.md` 一步步做。

## 自己动手

```bash
npm install
npm run doctor -- --online     # 体检
npm run new -- <期id>          # 新建一期
# 填 runs/<期id>/sources/ 和 episode.json（见 skills/launch-video/references/）
npm run tts -- <期id>
npm run assemble -- <期id>
npm run stills -- <期id>       # 检查帧
npm run render -- <期id>       # 成片
npm run qa -- <期id>           # 质检报告
npm run studio                 # 浏览器实时预览
```

## 预留
- `categories/`：按类目扩展章节骨架与素材槽位
- 后续：Web 管理端、MCP server、自动监听发布、导出剪映草稿
