# 踩坑记录

| 现象 | 原因 | 解决 |
|---|---|---|
| curl / git 报 `SSL_ERROR_SYSCALL` | 环境里的 HTTP(S)_PROXY 失效 | `curl --noproxy '*'`，或 `env -u HTTPS_PROXY -u HTTP_PROXY <命令>` |
| Agent 沙箱里联网/写文件静默失败 | 沙箱限制 | 联网、渲染命令在沙箱外执行 |
| 官网返回 403 / Cloudflare 验证页 | 站点拦截脚本访问 | 用真实浏览器工具读；不要绕过机器人检测（见 research.md） |
| check-facts 说 exact 找不到，但原文明明有 | 原文用了 U+2011 连字符、弯引号、不换行空格 | 脚本已做归一化；仍找不到就是摘录不是逐字原文，重新复制 |
| render 报“public/ep 里是另一期的时间轴” | 上次 assemble 的是别的期 | 先 `npm run assemble -- <id>` |
| render 显示完成但没有 video.mp4 | Remotion 4 的 `renderMedia` 参数是 `outputLocation`，写成 `output` 会只返回内存 buffer | 已在 render.mjs 修复；自己写渲染脚本时注意 |
| MiniMax `code=1002 rate limit exceeded(RPM)` | 免费额度每分钟请求数限制 | tts 已串行 + 3.5s 间隔 + 自动重试；重跑会从缓存断点继续。仍超限就调大 `MINIMAX_MIN_INTERVAL_MS` |
| MiniMax 鉴权失败 | 国内站与国际站 key 不通用 | `MINIMAX_BASE` 与 key 所属站点一致 |
| 生图服务 401 | 生图工具的 key 过期 | 让用户更新；立绘不是必需，可用 SVG 占位 |
| 高亮圈偏离数据点 | 在缩放过的预览图上量坐标 | 用 `npm run locate` 在原图上测 |
| 主播说话时人物跳动 | 张嘴/闭嘴图尺寸或站位不一致 | 所有姿势同分辨率，cutout.py 一次处理全部图片 |
| 抠图后白衣服偏紫 | FFmpeg despill 作用于全图 | 用 cutout.py（只处理边缘） |
| 成片音量很小 | MiniMax 原始音频偏轻 | tts 后处理含 loudnorm；改后处理要换 `POST_VERSION` |
| 字幕比声音早 0.1–0.2 秒 | TTS 音频开头自带静音 | tts 已裁首尾静音 |
| Studio 预览不到新内容 | public/ep 未更新 | 重跑 assemble |
