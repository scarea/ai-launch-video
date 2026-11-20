# 稿件与画面计划（runs/<id>/episode.json）

`npm run assemble` 会按 `packages/core/schema.mjs` 校验，错误会指出具体位置。参考完整样例：`runs/fable-5-2/episode.json`。

## 结构

```jsonc
{
  "id": "gpt-6-2",
  "category": "ai-model-launch",
  "date": "2026.11.20",                         // 栏目日期（右上角）
  "vendor": { "name": "OpenAI", "short": "O", "accent": "#10A37F" },  // 厂商主色做强调色；不用官方 Logo 图
  "title": ["GPT-6.2", "全面拆解"],              // 开场大标题两行
  "subtitle": "一句话说明这期讲什么",
  "highlights": [{ "tag": "编程", "title": "≤14 字的看点" }],          // 开场最多 3 张卡
  "intro":   { "cues": [ ... ] },
  "chapters": [ { "id": "coding", "title": "编程评测", "accent": "副标题（橙色部分）", "source": "左下角来源标注", "cues": [ ... ] } ],
  "outro":   { "title": "首发拆解", "accent": "我们下期见", "cues": [ ... ] }
}
```

### cue（一句旁白）

```jsonc
{
  "text": "Fable 5.2 在 Xhigh 档拿到 49.1%",   // 12–32 字，口语，少用句号；超过 34 字校验会提醒
  "evidence": ["F22"],                         // 含数字/状态/条件的句子必填
  "pauseMs": 320,                              // 句后停顿：默认 320，转折/换段 500–700
  "visual": { ... },                           // 不写则沿用上一句的画面；每章第一句必须写
  "side": { "tabs": ["A", "B"], "activeTab": 0, "metric": { "value": "49.1%", "label": "≤14 字", "ratio": 0.491 } },
  "pose": "idle | point | think",             // 指图时 point，讲限定/反转时 think
  "emotion": "happy"                           // 可选，仅 MiniMax 生效
}
```

`side` 会和上一句合并（只写变化的字段）；`"metric": null` 可清除指标环。标签最多 4 个。

### visual 类型

| kind | 用途 | 必填 |
|---|---|---|
| `image` | 官方图表/截图，可推近和高亮 | `src`（相对 runs/<id>/），可选 `focusFrom` `focus` `highlight` `bg` |
| `video` | 官方演示短循环（静音播放） | `src` |
| `bars` | 自绘柱状图，数字来自 facts | `title` `items[{label,value,highlight?}]`，可选 `unit` `note` |
| `table` | 价格表、规格表、对比表 | `columns` `rows`（每行列数一致），可选 `highlightRow` `note` |
| `stat` | 一个大数字 | `value` `label`，可选 `sub` |
| `points` | 2–3 条要点 | `items`，可选 `heading` |
| `quote` | 官方原话（≤25 词） | `text`，可选 `zh` `by` |

坐标与推近见 visuals.md。

## 写稿规则

- **章节**：按 category.json 的骨架取舍，5–7 章；总时长 5–7 分钟 ≈ **90–100 句、2000–2400 字**（英文字母、数字也计入；MiniMax 1.1 倍速约 6.5 字/秒）
- **开场**（5–6 句）：日期 + 发布了什么 → 2–3 个最硬的看点 → 一句反转（“但它不是全面领先”）→ 本期怎么讲
- **必须有“输在哪里”**：对手更高的评测、退步的档位、注脚限定。至少 3 句
- **数字照抄 facts**，条件要讲清（档位、是否带工具、谁跑的）；厂商自测要说是厂商数据，不说“实测”
- **推算的数字**（如降价比例）要能从 facts 直接算出，并在 facts 的 conditions 里注明是推算
- 一句只讲一件事；长句按语义拆成两句，每句都能单独做字幕
- 英文名照官方写法；TTS 念不准的词可以改写（如 “GPT-6.2” 不要写成 “GPT6.2”）
- 结尾：一句总结 + 官方建议谁该用 + “数字来自厂商自测”的提示

## 画面节奏

- 每 2–4 句换一个画面；同一张图可以用 `focusFrom → focus` 移镜头，比换图更连贯
- 讲具体数字时，对应的点或格子要 `highlight`
- 评测图优先用官方原图；官方没有图的数字用 `bars`/`table` 自绘
- 价格、规格一律用 `table` 自绘（清晰、可控）
