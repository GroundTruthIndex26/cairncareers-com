# cairncareers.com

The production site for CairnCareers — career-planning context for college
students and recent graduates, built by Phronesis Labs LLC.

## Stack

- **Vite + React + wouter** — client-side app, all marketing/legal pages as real routes.
- **Cloudflare Workers** — static assets plus one small Worker route (`/api/launch-notifications`, `worker/index.ts`), deployed via Workers Builds (git-integrated CI/CD).
- **Cloudflare Browser Rendering** — `scripts/prerender.mjs` prerenders every indexable route to real static HTML during the build, so crawlers (search and AI) see full content instead of an empty SPA shell. See the comments in that file and in `wrangler.jsonc` for why.

## Local development

```bash
npm install
npm run dev          # Vite dev server
npm run build        # production build: vite build + prerender
npm run build:spa    # vite build only, no prerender (faster local checks)
npm run check         # tsc --noEmit
```

`npm run build`'s prerender step needs two env vars — `PRERENDER_CF_ACCOUNT_ID`
and `PRERENDER_CF_BROWSER_TOKEN` (a Cloudflare API token scoped to Account →
Browser Rendering → Edit) — set as build-time environment variables on the
Workers Builds triggers in production, or in your shell for a local test build.

## Structure

- `client/src/pages/Home.tsx` — the landing page.
- `client/src/pages/{Privacy,Terms,Refunds,Contact}.tsx` — legal and contact pages.
- `client/src/pages/Roadmap.tsx` — the one dashboard-preview sample page promoted to a real, indexed route.
- `client/public/dashboard-preview/*.html` — the other sample-dashboard pages, kept as plain static files (all `noindex`, illustrative data only).
- `worker/index.ts` — the one server-side route this site needs.
