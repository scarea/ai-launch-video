# 首发拆解 · AI 新模型发布讲解视频

本仓库把“某个 AI 模型发布了”变成一支 5–7 分钟的中文讲解视频（1080p + 字幕）。

## 任何 Agent 接手时先做这两件事

1. 运行 `npm run doctor -- --online`，把结果整理后告诉用户：**缺什么配置、怎么配、按当前配置能做出什么**。用户确认前不要开始付费或耗时的步骤
2. 读 `skills/launch-video/SKILL.md`，按里面的步骤做；每一步的细节在 `skills/launch-video/references/`

依赖没装时：`npm install`，Python 环境见 references/setup.md。

## 目录
- `packages/core/`        流水线：doctor / new / check-facts / tts / assemble / render(stills) / qa；工具：locate（图表坐标）/ cutout（立绘抠图）
- `packages/providers/`   可替换服务：tts/edge（免费）、tts/minimax
- `packages/templates/`   Remotion 模板（代码绘制的画面与动效）
- `categories/<类目>/`    章节骨架、素材槽位、目标时长
- `brand/`                栏目名、配色、主播立绘、默认音色
- `runs/<期id>/`          每期输入与产物；`runs/fable-5-2/` 是完整样例
- `public/ep/`、`out/`    生成物，不手改、不提交

## 约定
- 数字、状态、开放条件必须能在 `runs/<id>/sources/facts.json` 找到依据；cue 用 `evidence` 引用
- 厂商宣称不说成实测；每期都要讲“它输在哪里”
- 官方图表标注来源，不使用厂商 Logo 图；主播只用原创角色
- 密钥只放 `.env`，不提交、不在回复里复述
- 不自动上传、发布
