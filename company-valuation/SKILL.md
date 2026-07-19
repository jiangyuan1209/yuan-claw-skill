---
name: company-valuation
description: AI-powered company valuation analysis. Researches a company's public information, performs valuation using revenue multiple and DCF methods, and generates a structured report with source traceability.
tags: [valuation, finance, research, company, startup, analysis, report]
license: MIT
version: 1.0.0
---

## Instructions

When the user asks to analyze or value a company, follow these steps:

1. **Search company background** - Use `web_search` to find company overview, products, business model
2. **Search funding history** - Find all funding rounds, investors, amounts, dates, and any reported valuations
3. **Search revenue data** - Look for ARR, revenue, growth rates, user metrics
4. **Search comparable companies** - Find similar public companies and their valuation multiples
5. **Estimate key metrics** - Based on collected data, estimate annual revenue and growth rate
6. **Compute valuation** - Use revenue multiple method and DCF (discounted cash flow)
7. **Generate report** - Output a structured markdown report

### Output Format

The final response should include:
- Company summary
- Key information (funding, users, revenue)
- Source list with URLs
- Core assumptions (clearly marked as fact vs estimate)
- Valuation calculation details
- Total valuation and price per share
- Risk and uncertainty notes

### Important Rules

- ALWAYS cite sources for factual claims
- Clearly distinguish between confirmed data and estimates
- If data is unavailable, state that explicitly rather than fabricating
- Use reasonable assumptions when data is missing, but label them as assumptions
- The valuation is an estimate, not a guarantee of actual value
