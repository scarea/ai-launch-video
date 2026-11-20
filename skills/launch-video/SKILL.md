---
name: launch-video
description: 为一次 AI 新模型发布制作 5–7 分钟中文讲解视频（环境体检 → 官方资料包 → 稿件与画面计划 → 配音 → Remotion 渲染 → 质检）。用户说“做一期 XX 模型的视频”“讲解 XX 发布”时使用。
---

# 首发拆解：做一期模型发布讲解视频

适用于任何能读写文件、执行命令、联网的 Agent（Codex、Claude Code 等）。全部命令在仓库根目录执行。

## 第 0 步：体检，并把结果告诉用户（必做）

```bash
npm run doctor -- --online
```

把输出整理成三件事告诉用户，**在用户确认前不要开始付费或耗时的步骤**：
1. **缺什么**（✗ 项）以及怎么配：逐项给出 doctor 打印的修复命令；需要用户自己提供的东西（API key、立绘）明确说出来
2. **可选增强**（△ 项）：比如没有 MiniMax 时用 edge 免费配音，效果偏平
3. **按当前配置能做出什么**：照抄 doctor 的“能做出什么”一段

配置细节、每项 key 的作用和降级规则见 [references/setup.md](references/setup.md)。

## 第 1 步：确认选题

和用户确认：哪个模型（官方名称）、发布日期、栏目日期、是否有必须讲的点、目标时长（默认 5–7 分钟）。
新建一期：

```bash
npm run new -- <期id>        # 例：npm run new -- gpt-6-2，生成 runs/<id>/ 骨架
```

## 第 2 步：官方资料包 → [references/research.md](references/research.md)

产出 `runs/<id>/sources/`：`text/*.md` 正文留档、`figures/` 官方图、`manifest.json`、`facts.json`（每条事实带原文短摘录和评测条件）。
**只用官方来源**；第三方数字只在官方引用时使用并标注。没核实的标 `unverified`，稿件不能引用。
完成后运行 `npm run check-facts -- <id>`，必须 0 问题再写稿。用户给的日期和官方不一致时以官方为准，并告诉用户。

## 第 3 步：稿件与画面计划 → [references/script.md](references/script.md)

写 `runs/<id>/episode.json`。章节骨架见 `categories/ai-model-launch/category.json`。
每句含数字的旁白必须用 `evidence` 引用 facts 的 id；**一定要写“它输在哪里”的章节**，不做厂商宣传片。

画面与高亮坐标 → [references/visuals.md](references/visuals.md)。坐标必须用 `npm run locate` 在**原图**上测，不要估。

## 第 4 步：制作

```bash
npm run tts -- <id>          # 逐句配音（有缓存，改稿只重做改动的句子）
npm run assemble -- <id>     # 校验稿件 + 生成时间轴与字幕；有 ✗ 会直接报错并指出位置
npm run stills -- <id>       # 每个画面段抽一帧到 out/<id>-stills-*/
```

**逐张看检查帧**（遮挡、高亮是否圈中、表格是否可读、字幕是否超长），有问题改 episode.json 后重跑 assemble + stills。

```bash
npm run render -- <id>       # 成片 out/<id>-render-*/video.mp4 + subtitles.srt，约 5 分钟
npm run qa -- <id>           # 同步、音量、时长、解码、稿件引用 → runs/<id>/qa.json
```

质检标准与人工项 → [references/qa.md](references/qa.md)。

## 第 5 步：交付

告诉用户：成片路径、时长、qa 结果，以及**哪些没有检查**（例如没有完整试听）。不上传、不发布。

## 出问题时

先看 [references/troubleshooting.md](references/troubleshooting.md)：代理失效、沙箱拦截、MiniMax 限流、渲染不出文件等都有现成解法。

## 主播形象

默认读 `brand/brand.json`。要做新形象 → [references/avatar.md](references/avatar.md)。**只能用原创角色**，不要画任何现有作品里的角色。
