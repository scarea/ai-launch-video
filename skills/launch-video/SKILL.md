---
name: launch-video
description: 为一次 AI 新模型发布制作 5–7 分钟中文讲解视频（资料包 → 稿件与画面计划 → 配音 → Remotion 渲染）。
---

# 制作一期「首发拆解」

## 1. 资料包 `runs/<id>/sources/`
- 只用官方资料：发布公告、模型文档、价格页、系统卡；第三方只在官方引用时使用
- `text/*.md` 正文留档；`figures/` 官方图原图；`manifest.json` 图表说明；`facts.json` 事实清单（含原文短摘录、评测条件）

## 2. 稿件与画面计划 `runs/<id>/episode.json`
- 章节骨架见 `categories/ai-model-launch/category.json`，按资料取舍，不凑章节
- 每个 cue：12–32 个汉字的口语短句，少用句号；`pauseMs` 转折 450–700，默认 320
- `evidence: [factId]`：含数字/条件的句子必须引用
- `visual`（没写就沿用上一句）：
  - `image` 官方图，`focus:[x,y,w,h]` 推近区域、`highlight:{x,y,r}` 高亮圈（0–1 相对坐标）
  - `bars` / `table` / `stat` / `points` / `quote` 用代码绘制，数字来自 facts
- `side`：右侧切换标签 `tabs/activeTab` 与指标环 `metric{value,label,ratio}`；`pose`: idle|point|think
- 开场：有依据的反差或悬念，预告不超过 3 个重点；结尾一句话总结适合谁用

## 3. 制作
```bash
npm run tts -- <id>        # 逐句配音（缓存）
npm run assemble -- <id>   # 生成 timeline 与字幕
npm run stills -- <id>     # 抽检查帧到 out/，逐张看图
npm run render -- <id>     # 成片 out/<id>-render-*/video.mp4 + subtitles.srt
npm run studio             # 可选：浏览器实时预览
```

## 4. 检查
- 看每个视觉段的检查帧：遮挡、清晰度、高亮位置、字幕长度
- 逐条核对 cue 中的数字与 facts.json
- 只声称实际做过的检查
