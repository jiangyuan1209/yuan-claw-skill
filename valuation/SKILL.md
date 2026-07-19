---
name: ai-company-valuation
description: Research and evaluate AI company valuations using multiple methods (Revenue Multiple, DCF). Supports data collection via web search, parameter adjustment, and report generation.
tags: [valuation, finance, research, ai-company, perplexity]
version: 1.0.0
---

## AI 公司估值分析技能

当用户要求对一家 AI 公司进行估值分析时，使用此技能。

### 工作流程

1. **信息收集**
   - 使用 `web_search` 搜索目标公司的融资历史、收入估算、可比公司
   - 使用 `http_fetch` 读取详细的财经文章
   - 使用 `extract_readable_text` 清理页面内容
   - 将收集到的数据保存为 JSON 格式

2. **估值计算**
   - 读取 `src/valuation/default-assumptions.json` 中的默认假设
   - 根据收集到的信息更新关键参数
   - 运行估值引擎（收入倍数法 + DCF）
   - 计算加权综合估值和每股价值

3. **报告生成**
   - 生成 Markdown 格式报告
   - 生成 HTML 格式报告
   - 包含：公司概况、信息来源、核心假设、估值结果、敏感性分析、风险提示

### 可用估值方法

| 方法 | 公式 | 适用场景 |
|------|------|----------|
| 收入倍数法 | 估值 = 年收入 × 倍数 | 早期高增长公司 |
| DCF 现金流折现 | Σ(FCF/(1+r)^t) + PV(终值) | 成熟可预测公司 |

### 关键参数

- `revenueEstimate`: 年收入估计 (USD)
- `growthRate`: YoY 增长率
- `revenueMultiple`: 行业收入倍数
- `operatingMargin`: 运营利润率
- `discountRate`: 折现率 (WACC)
- `terminalGrowthRate`: 永续增长率
- `sharesOutstanding`: 总股本

### 运行方式

```bash
# CLI 运行
npx tsx src/valuation/cli-entry.ts

# 启动 Web 服务
npx tsx src/valuation/cli-entry.ts --server

# 或直接启动服务器
npx tsx src/server/index.ts
```

### 注意事项

- 所有数据来源必须可追溯，提供 URL 引用
- 缺失数据需做合理假设并明确标注
- 每股价值推导需说明股本假设依据
