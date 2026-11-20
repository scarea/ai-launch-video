# 首发拆解 · AI 新模型发布讲解视频

任何 Agent（Codex、Claude Code 等）制作一期视频：先读 `skills/launch-video/SKILL.md`。

## 目录
- `packages/core/`        流水线脚本：tts → assemble → stills → render
- `packages/providers/`   可替换服务（tts/edge 免费，tts/minimax 预留）
- `packages/templates/`   Remotion 模板（代码绘制的画面与动效）
- `categories/<类目>/`    类目配置：章节骨架、素材槽位、写稿规则
- `brand/brand.json`      栏目名、配色、形象、默认音色
- `runs/<期id>/`          每期输入与产物：sources/ episode.json audio/ timeline.json
- `public/ep/`            当前预览构建（assemble 生成，不手改）
- `out/`                  检查帧与成片，每次新目录

## 约定
- 数字、状态、开放条件必须能在 `runs/<id>/sources/facts.json` 找到依据；cue 用 `evidence` 引用 fact id
- 厂商宣称不说成实测；没跑过就不说“我测过”
- 官方图表标注来源；不使用他人人物形象与私人音色
- 不自动上传、发布
- 本机 HTTP(S)_PROXY 可能失效，联网失败时直连
