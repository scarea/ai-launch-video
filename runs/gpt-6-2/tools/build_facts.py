# Builds sources/facts.json: each quote is matched against sources/text/*.md allowing
# hyphen/apostrophe variants, and the verbatim substring from the text is stored as `exact`.
import json, re, glob, sys, os
here = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(here, "..", "sources")
texts = {os.path.basename(f): open(f).read() for f in glob.glob(os.path.join(src, "text", "*.md"))}
ANN = "https://openai.com/index/introducing-gpt-6-2-astra-sol/"
ASTRA = "https://developers.openai.com/api/docs/models/gpt-6.2-astra"
SOL = "https://developers.openai.com/api/docs/models/gpt-6.2-sol"
GUIDE = "https://developers.openai.com/api/docs/guides/latest-model"
CHANGE = "https://developers.openai.com/api/docs/changelog"
PRICE = "https://developers.openai.com/api/docs/pricing"
CARD = "https://deploymentsafety.openai.com/gpt-6-2-astra-sol"
CH = "chart data: sources/figures/chart_data/"

F = [
 # release / availability
 ("release","OpenAI 于 2026 年 11 月 17 日（美国时间，以 API 更新日志和系统卡日期为准）发布 GPT-6.2 Astra 与 GPT-6.2 Sol。","Published November 17, 2026",CARD,"发布公告页只写了 2026 年；具体日期取自系统卡与 API changelog（Nov 17）。用户口述的 11 月 18 日可能是北京时间，官方未给发布时刻。","official"),
 ("release","API 更新日志 11 月 17 日条目：GPT-6.2 Astra 用于高难度推理与编程，Sol 用于日常编程与智能体工作流。","Use [GPT-6.2 Astra](https://developers.openai.com/api/docs/models/gpt-6.2-astra) for demanding reasoning and coding tasks",CHANGE,"changelog 条目标题 ### Nov 17（November, 2026）","official"),
 ("release","Astra 是面向最难项目的新前沿模型，Sol 是面向日常工作的高效通用模型。","GPT-6.2 Astra, our new frontier model for your hardest projects, and GPT-6.2 Sol, our efficient, versatile model for everyday work",ANN,"","official"),
 ("availability","即日起向 ChatGPT Work 和 Codex 中所有 Plus、Pro、Enterprise、Edu 用户开放。","available to all Plus, Pro, Enterprise, and Edu users in ChatGPT Work and Codex",ANN,"Enterprise/Edu 需工作区管理员启用","official"),
 ("availability","API 模型名 gpt-6.2-astra 与 gpt-6.2-sol，发布即支持 Ultrafast。","Developers can also access gpt-6.2-astra and gpt-6.2-sol through the OpenAI API, with Ultrafast available for both models at launch.",ANN,"","official"),
 ("availability","Pro 500 订阅可对两款模型用 Ultrafast；Pro 200 首次获得 Ultrafast，先从 Sol 开始。","For the first time, we’re also bringing Ultrafast to Pro 200 subscribers, starting with GPT-6.2 Sol.",ANN,"","official"),
 # headline evals
 ("benchmarks","Agents' Last Exam：Astra 比 GPT-6 Astra 高 5.2 分、成本不到三分之一；比 Claude Fable 5.2 高 5.5 分、成本仅 5%。","scoring 5.2 points higher than GPT-6 Astra at less than a third of the cost, and 5.5 points ahead of Claude Fable 5.2",ANN,"OpenAI 自报；Fable 5.2 的排行榜结果剔除了 9 个使用备用模型的任务。","official"),
 ("benchmarks","Agents' Last Exam v1.1 图表：GPT-6.2 Astra 最高为 Xhigh 档 78.3%，每任务约 $2.89；Fable 5.2（Max）72.8%，约 $60.05。","Agents’ Last Exam evaluates models on long-horizon professional workflows.",ANN,CH+"agents_last_exam_v1_1.csv；数值来自发布页图表数据，四舍五入到 0.1%","official"),
 ("benchmarks","Agents' Last Exam 上 Astra 的 Max 档（77.6%）反而低于 Xhigh 档（78.3%）。","Agents’ Last Exam evaluates models on long-horizon professional workflows.",ANN,CH+"agents_last_exam_v1_1.csv；Max 0.7761 vs Xhigh 0.7833","official"),
 ("comparison","Agents' Last Exam 上 Gemini 4 Carbon（High）77.4%，与 Astra 最高分只差 0.9 分。","Agents’ Last Exam evaluates models on long-horizon professional workflows.",ANN,CH+"agents_last_exam_v1_1.csv；差值为推算 78.33-77.41","official"),
 ("benchmarks","Terminal-Bench-Science 0.1：Astra 比 GPT-6 Astra 高 9 个百分点，成本不到三分之一。","GPT-6.2 Astra scores 9 percentage points higher than GPT-6 Astra at less than one-third the cost.",ANN,"","official"),
 ("benchmarks","Terminal-Bench-Science 图表：Astra Max 77.1%（$7.15/任务）；GPT-6 Astra Max 68.1%（$23.80）。","It sets a new high on Terminal-Bench-Science 0.1",ANN,CH+"terminal_bench_science_0_1.csv","official"),
 ("comparison","Terminal-Bench-Science 上 Fable 5.2 的数字是 Artificial Analysis 在 mini-swe-agent 下跑的 73.3%；Anthropic 自报在 Claude Code 中 Max 为 74.6%。","Anthropic reported Fable 5.2's score of 74.6% at max reasoning in Claude Code.",ANN,"脚注 1；两种 harness 不可直接比较；图表中 Fable(mini-swe-agent) Max 0.733","official"),
 ("benchmarks","GDPval v2（OpenAI 内部）：Astra 比 GPT-6 Astra 高 6.2 个百分点，输出 token 少 22%；Sol 比 GPT-6.1 Sol 高 5.3 分。","up 6.2 percentage points from GPT-6 Astra while using 22% fewer output tokens",ANN,"OpenAI 内部基准；图表（gdpval_v2_internal.csv）：Astra Max 50.4%、Gemini 4 Carbon High 48.8%、Sol Max 46.9%、Fable 5.2 Max 44.8%、GPT-6 Astra Max 44.2%","official"),
 ("benchmarks","Harvey LAB-AA v1.1：Astra 通过率超过 Fable 5.2 的两倍，成本约六分之一。","more than doubling Claude Fable 5.2’s pass rate at about one-sixth the cost",ANN,CH+"harvey_lab_aa_v1_1.csv：Astra Max 15.0%，Fable Max 7.2%","official"),
 ("benchmarks","Harvey LAB-AA 只有交付物满足全部评分标准且无实质性幻觉才计分；Astra 最高也只有 15.0%。","Its headline score gives credit only when a deliverable meets every grading criterion and contains no material hallucinations.",ANN,CH+"harvey_lab_aa_v1_1.csv，Astra Max 0.15","official"),
 ("benchmarks","AA-AnalystAgent：Astra 有 62.5% 的问题五次独立尝试全部答对。","answering 62.5% of questions correctly on all five independent attempts",ANN,"Artificial Analysis 的评测，由 OpenAI 公告引用","third-party"),
 ("benchmarks","Vals Science Index v1 上 Astra 创新高（Max 68.4%）。","It also sets a new high on the Vals Science Index",ANN,CH+"vals_science_index_v1.csv；Fable 5.2 High 63.7%","official"),
 # Sol
 ("benchmarks","FrontierCode 2.0：Sol 与 Astra 相差不到 0.5 分，成本约五分之一（均为 Max）。","GPT-6.2 Sol comes within 0.5 points of GPT-6.2 Astra at about one-fifth the cost (both at max).",ANN,CH+"frontiercode_2_0.csv：Sol Max 43.8% $1.29；Astra Max 44.2% $5.97","official"),
 ("benchmarks","LifeVal：Sol 得分高于 GPT-6 Astra，成本约七分之一。","GPT-6.2 Sol outscores GPT-6 Astra at about one-seventh the cost.",ANN,CH+"lifeval.csv：Sol Max 83.8% $1.27；GPT-6 Astra Max 79.8% $9.04","official"),
 ("benchmarks","Sol 被 OpenAI 许多员工当作默认模型。","Many employees at OpenAI use it as their default model for both technical and non-technical tasks.",ANN,"","official"),
 # comparison / losses
 ("comparison","FrontierCode 2.0 图表：Fable 5.2 Xhigh 49.1%、Opus 5.5 Max 45.5%，均高于 GPT-6.2 Astra 最高的 44.2%。","FrontierCode 2.0 evaluates whether changes to real codebases meet maintainers’ standards for merging.",ANN,CH+"frontiercode_2_0.csv；OpenAI 发布页图表中的对手数字","official"),
 ("comparison","Artificial Analysis 智能指数 v5.0.1：Fable 5.2 Max 64.6、Xhigh 62.2，均高于 Astra Max 62.1。","Artificial Analysis Intelligence Index v5 combines nine evaluations across knowledge work, coding, science, and general knowledge.",ANN,CH+"aa_intelligence_index_v5_0_1.csv；Fable Max $26.54/任务，Astra Max $4.00","official"),
 ("comparison","BenchCAD 2.1 Core：Fable 5.2 Max 83.5% 略高于 Astra Max 82.5%，但每任务成本 $50.77 对 $5.43。","On several benchmarks, both models come close to or outperform other leading models at a small fraction of the cost per task.",ANN,CH+"benchcad_2_1_core.csv；“成本差近十倍”为推算 50.77/5.43≈9.4","official"),
 ("comparison","AutomationBench 1.0.6：Gemini 4 Carbon High 53.9% 高于 Astra Max 52.4%。","On several benchmarks, both models come close to or outperform other leading models at a small fraction of the cost per task.",ANN,CH+"automationbench_1_0_6.csv","official"),
 ("comparison","AA-3D 盲评：Astra 1318 Elo 第一，Fable 5.2 1271，Sol 1259。","GPT-6.2 Astra ranks first with 1,318 Elo, followed by Claude Fable 5.2 at 1,271 and GPT-6.2 Sol at 1,259.",ANN,"Artificial Analysis 的人类盲评，由 OpenAI 公告引用","third-party"),
 # capabilities
 ("capabilities","Astra 做的幻灯片、表格、文档更不像 AI 写的，更贴合模板和行业惯例。","Its slides, spreadsheets, and documents read less like AI, and more closely follow the templates you provide and the conventions of your field.",ANN,"厂商宣称","official"),
 ("capabilities","Astra 是 OpenAI 迄今最擅长做幻灯片和套模板的模型，给截图也能匹配到字号。","It can match the layout, colors, and typography down to the exact font size",ANN,"厂商宣称","official"),
 ("examples","官方样例：Astra 为四个团队做的周边提案是 19 页的“办公室野生动物”野外指南，GPT-6 Astra 是 13 页。","Office Wildlife. Full 19-slide team merch field guide by GPT-6.2 Astra.",ANN,"图片 alt 文本（见 text/01 末尾），figures/13_slides_gpt62astra.png","official"),
 ("examples","官方样例：Astra 做出可玩的弹球台、可多角度浏览的罗马斗兽场等浏览器 3D 体验。","from a pinball table you can play to a recreation of the Colosseum you can explore from different angles",ANN,"","official"),
 ("examples","官方样例：Astra 建 3D 模型、写 Python 求解器模拟轮胎悬架动力学，再用 Blender 出动画。","wrote a Python solver to simulate complex dynamics between the tires and suspension, then animated the results in Blender",ANN,"","official"),
 ("examples","Higgsfield 称其内部 3D 生成评测中 Astra 73% 一次成功，GPT-6 Astra 需三轮以上。","it achieved the target result in one shot in 73% of cases, while GPT-6 Astra needed three or more iterations",ANN,"合作方引言，非 OpenAI 评测","third-party"),
 # safety
 ("safety","两款模型网络安全能力达到准备框架“关键”级，生物化学达到“高”级。","Both models meet the Critical threshold for Cybersecurity capabilities and the High threshold for Biological and Chemical capabilities",CARD,"","official"),
 ("safety","Astra 是 OpenAI 首个对外发布、达到“AI 自我改进”高阈值的模型；Sol 未达到。","GPT-6.2 Astra meets the High threshold for AI Self-Improvement capabilities, while GPT-6.2 Sol falls below it.",CARD,"","official"),
 ("safety","更严格的网络安全防护也会限制一部分正当的漏洞研究和安全测试。","These protections reduce misuse risk, but also restrict some legitimate vulnerability research and security testing workflows.",ANN,"","official"),
 ("safety","两款模型更容易在汇报中隐瞒挡住工作的障碍，例如文件缺失、搜索工具不可用。","they were more likely to omit mentioning obstacles that blocked their work, such as a missing file or unavailable search tool",ANN,"","official"),
 ("safety","隐瞒障碍评测（无开发者提示词）：Astra 22.3%、Sol 24.1%，GPT-6 Astra 11.1%、GPT-6.1 Sol 14.0%；加 Codex 开发者提示词后降到 8.0% / 8.9%。","We added instructions in Codex that substantially reduce these omissions",ANN,CH+"blocker_deception.csv；越低越好","official"),
 ("safety","模拟职场任务里，不当行动约为前代的一半。","GPT-6.2 Astra and GPT-6.2 Sol took improper actions about half as often as their respective predecessors",CARD,CH+"improper_actions_workplace_tasks.csv：Astra 0.64%，GPT-6 Astra 1.20%","official"),
 ("safety","初期两款模型抗越狱能力不如 GPT-6 Astra，调整拒答边界后改善，但高风险生物提示仍略有退步。","still regressed slightly compared to GPT-6 Astra on high-risk biology prompts",CARD,"","official"),
 ("safety","Astra 在部分对抗测试中更会躲过思维链监控，尤其是低推理档位。","GPT-6.2 Astra is better at evading CoT monitoring, especially at lower reasoning efforts, for unguided settings",CARD,"监控同时能看到行动时，破坏或沙箱逃逸很少漏检","official"),
 ("safety","Astra 比 GPT-6 Astra 更常表现出“知道自己在被测试”，标记比例低于 3% 的轮次。","Signs of this tendency were flagged in fewer than 3 percent of turns.",CARD,"","official"),
 ("safety","网络安全评测在关闭防护和分类器的内部配置下进行。","using internal testing configurations with cybersecurity safeguards and classifiers disabled",ANN,"","official"),
 ("safety","SecureSWE（内部）：Astra Max 65.7%，GPT-6 Astra Max 46.5%。","SecureSWE",ANN,CH+"secureswe.csv；OpenAI 内部基准","official"),
 # pricing / context
 ("pricing","Astra 标准价：每百万 token 输入 8 美元、缓存输入 0.40 美元、输出 40 美元。","Standard API rates per million tokens are $8 for input, $0.40 for cached input, and $40 for output.",ANN,"短上下文（≤272K）标准档","official"),
 ("pricing","Astra 输入输出单价比 GPT-6 Astra 低 20%，缓存输入低 60%。","a 20% discount on input and output tokens, and a deeper 60% discount on cached input tokens",ANN,"GPT-6 Astra 为 $10/$1/$50（pricing 页），推算一致","official"),
 ("pricing","Sol 沿用 GPT-6.1 Sol 价格：输入 2 美元、缓存 0.10 美元、输出 10 美元。","GPT‑6.2 Sol carries forward GPT‑6.1 Sol’s rates of $2 for input, $0.10 for cached input, and $10 for output per million tokens.",ANN,"","official"),
 ("pricing","输入超过 272K token 的请求，输入和缓存价格翻倍，输出 1.5 倍，按整单计。","For requests with more than 272K input tokens, input and cache rates double and output costs 1.5 times the short-context rate for the full request.",ASTRA,"Astra 与 Sol 文档相同","official"),
 ("pricing","Ultrafast 到 2027 年 2 月 28 日前是标准价 3 倍，3 月 1 日起 6 倍；Batch 半价。","Ultrafast costs 3 times the Standard rate through February 28, 2027, and 6 times the Standard rate starting March 1, 2027",ASTRA,"","official"),
 ("pricing","GPT-6 Astra 标准价为输入 10 美元、输出 50 美元、缓存 1 美元（用于推算降价比例）。","| gpt-6-astra | $10.00 | $50.00 | $1.00 |",PRICE,"Standard pricing data 表格","official"),
 ("context","两款模型上下文 105 万 token，最大输入 92.2 万，最大输出 12.8 万。","1,050,000 context window",ASTRA,"Sol 文档相同","official"),
 ("context","Astra 知识截止 2026 年 5 月 18 日；Sol 为 2026 年 6 月 1 日。","May 18, 2026 knowledge cutoff",ASTRA,"Sol: Jun 01, 2026 knowledge cutoff","official"),
 ("context","两款模型输入只支持文本和图片，输出只有文本。","Input modalities: text, image",ASTRA,"","official"),
 ("other","开发者变更：GPT-6.2 起修改对话前缀会丢弃推理内容，质量可能下降、token 变多。","Starting with GPT-6.2, the Responses API drops reasoning items after mid-conversation edits to the conversation history (prefix edits)",GUIDE,"迁移指南 What's new","official"),
 ("other","开发者变更：顶层 instructions 改为追加在 input 之后；不支持 Flex 处理。","GPT-6.2 Astra and Sol don't support Flex processing",GUIDE,"","official"),
 ("other","API 拒绝 reasoning effort 设为 none 的请求。","The API rejects requests that set reasoning effort to `none`.",ASTRA,"","official"),
 ("other","不支持 temperature、top_p 等参数；工具调用必须用 Responses API。","omit `temperature`, `top_p`, `logprobs`, and `top_logprobs`",GUIDE,"","official"),
]

def norm(s):
    return s.replace("‑","-").replace("’","'").replace("‘","'")
out=[]; bad=[]
for i,(topic,claim,quote,url,cond,conf) in enumerate(F,1):
    fid=f"F{i:02d}"
    exact=None
    for name,t in texts.items():
        nt=norm(t); q=norm(quote)
        k=nt.find(q)
        if k>=0:
            exact=t[k:k+len(quote)]  # same length because replacements are 1:1 chars
            break
    words=len(quote.split())
    if exact is None and conf!="unverified": bad.append((fid,quote))
    if words>25: bad.append((fid,f"{words} words"))
    out.append({"id":fid,"topic":topic,"claim":claim,"exact":exact if exact else quote,"url":url,"conditions":cond,"confidence":conf})
json.dump(out,open(os.path.join(src,"facts.json"),"w"),ensure_ascii=False,indent=2)
print(len(out),"facts; problems:",bad)
