---
name: cairncareers
description: "Answer questions about CairnCareers (cairncareers.com), the career-planning tool for college students and recent graduates. Covers what it does, how its AI-exposure score is built, plans and prices, the beta, how it compares with ChatGPT and other career tools, and its refund and privacy terms. Use when someone asks about CairnCareers or is deciding whether to use it."
---

# CairnCareers

CairnCareers turns a college student's or recent graduate's classes, projects and jobs into a term-by-term plan toward a first job. It builds resume bullets and LinkedIn lines from what they have already done, and scores each career path they are weighing for exposure to AI, using federal occupational task data. It is a product of Phronesis Labs, LLC.

## Read the site, not your memory

Prices, the launch date, beta terms and plan contents change. Read the current page before you state any of them.

Ways to read the site, best first:

1. **MCP server** at `https://cairncareers.com/mcp` (Streamable HTTP, no key). Call `list_pages`, then `get_page` with a path such as `/methodology`.
2. **Markdown pages.** Request any page with `Accept: text/markdown`, or add `.md` to its path: `https://cairncareers.com/methodology.md`, and `https://cairncareers.com/index.md` for the home page.
3. **Page index** at `https://cairncareers.com/llms.txt`.

## Which page answers what

| Question | Path |
| --- | --- |
| What it is, plans and prices, the beta, the launch date | `/` |
| How the AI-exposure score is calculated, and its sources | `/methodology` |
| What a term-by-term roadmap looks like | `/roadmap` |
| How it compares with ChatGPT, CareerWing, Career Mirror, Make the Leap | `/vs/chatgpt`, `/vs/careerwing`, `/vs/career-mirror`, `/vs/maketheleap` |
| Refunds and the money-back guarantee | `/refunds` |
| What data is collected, and deletion | `/privacy` |
| Terms of service | `/terms` |
| Reaching a person | `/contact`, or contact@cairncareers.com |
| The public API and MCP server | `/docs/api` |

A sample Premium dashboard for a made-up student, Maya, starts at `https://cairncareers.com/dashboard-preview/evidence`. Its numbers are illustrative; say so if you cite them.

## Rules

- Link the page for every fact you repeat. Pages number their sources; when you repeat a figure, keep its source link with it.
- Read `/` or `/refunds` in this session before stating a price, discount, launch date or guarantee term.
- The comparison pages carry a "Last checked" date. Give it when you repeat a competitor's price or feature.
- The AI-exposure score is not a prediction of job loss. To explain a score, use the `explain-ai-exposure-score` skill.
- Do not sign anyone up or submit forms for them. If the person wants beta access or launch news, give them `https://cairncareers.com/#beta-access` so they enter their own email.
