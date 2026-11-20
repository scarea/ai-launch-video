# 官方资料包（runs/<id>/sources/）

目标：让稿件里每个数字都能追溯到官方原文。可以交给子 Agent 并行做，但要把本文件整个交给它。

## 找哪些来源（按优先级）

1. **发布公告**（厂商博客 / newsroom）
2. **模型文档**：模型总览、该模型页面（上下文窗口、最大输出、知识截止、模型 ID、模态、思考档位）
3. **价格页**：输入/输出/缓存/批处理/长上下文/快速档的价格与条件
4. **系统卡 / 安全报告**：评测条件、安全发现、局限
5. 公告里链接的官方样例、研究文章、演示视频
6. 第三方评测：**只在官方引用时**记录，`confidence: "third-party"`

不要用媒体转述、社交媒体截图、聚合站作为事实来源。

## 产出

```
sources/
  text/<序号>_<slug>.md      每页正文，顶部写 URL 和抓取时间（仅内部核对用，不进视频）
  figures/                   官方原图（保持原分辨率）
    chart_data/*.csv         如果图表是网页脚本画的，能拿到原始数据就存下来
  manifest.json              [{file, sourceUrl, pageUrl, caption, whatItShows, keyNumbers}]
  facts.json                 见下
```

### facts.json

```json
[
  {
    "id": "F01",
    "topic": "release|availability|benchmarks|comparison|capabilities|examples|safety|pricing|context|other",
    "claim": "中文一句话结论",
    "exact": "≤25 词的英文原文摘录，必须能在 text/ 里逐字找到",
    "url": "来源页面",
    "conditions": "评测档位、harness、样本数、是否开防护、注脚等",
    "confidence": "official | third-party | unverified",
    "dataFile": "figures/chart_data/xxx.csv"   // 可选：数字只出现在图表数据里时填，exact 可留空
  }
]
```

要求：
- 30–60 条；覆盖发布与开放范围、核心评测（含对手数字与条件）、性价比、样例、安全、价格、规格、开发者破坏性变更
- **专门找“它输的地方”**：对手更高的评测、更高档位反而退步、注脚里的限定条件。至少 3 条
- 日期以页面为准；找不到发布时刻就标 `unverified`，不要猜
- 日期冲突（用户说的日期 ≠ 官方页面日期）：**以官方为准写进稿件**，并告诉用户差异（常见原因是时区）
- 写完运行 `npm run check-facts -- <id>`：核对每条 `exact` 能在 `text/` 里逐字找到（已处理 Unicode 连字符、弯引号、空白差异）、字段合法、id 不重复

## 读网页

按顺序尝试：
1. `curl --noproxy '*' -L <url>` 直接拿 HTML
2. 一些文档站支持在 URL 后加 `.md` 拿纯文本（如 developers.openai.com），先试一下
3. 返回 **403 / Cloudflare 验证页**：改用你手边的真实浏览器工具（浏览器面板、浏览器扩展）打开并读正文。**不要伪造 UA、绕过机器人检测或验证码**；都不行就请用户把页面另存为发给你

## 抓图

- 网页上的图表如果是 `<img>`，直接下载原图
- 如果是脚本绘制（canvas/svg/Vega）：
  - 先在页面源码里找内嵌数据（Vega-Lite spec 的 `data.values`、`<script type="application/json">`、`__NEXT_DATA__` 等），存成 `figures/chart_data/<名字>.csv`，稿件里用 `bars` / `table` 重绘，fact 用 `dataFile` 指向该 CSV
  - 需要原图样式时，用浏览器工具按元素截图（2 倍分辨率）存到 figures/
- 官方图里带厂商字标/Logo 的部分，用 `focus` 避开或裁掉，不要作为主体展示
- 视频：下载官方页面里的短循环（webm/mp4）即可；完整演示视频不下载
- 系统卡 PDF 的关键图：按页渲染成 PNG，文件名写页码（`syscard_p129_xxx.png`）

## 网络

本机可能设置了失效的 HTTP(S)_PROXY；联网报 `SSL_ERROR_SYSCALL` 时用 `curl --noproxy '*'` 或 `env -u HTTPS_PROXY -u HTTP_PROXY`。
