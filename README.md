# cairncareers.com

The production site for CairnCareers: career-planning context for college
students and recent graduates, built by Phronesis Labs LLC.

## Stack

- **Vite + React + wouter**: client-side app, all marketing/legal pages as real routes.
- **Cloudflare Workers**: static assets plus one small Worker route (`/api/launch-notifications`, `worker/index.ts`), deployed via Workers Builds (git-integrated CI/CD).
- **Cloudflare Browser Rendering**: `scripts/prerender.mjs` prerenders every indexable route to real static HTML during the build, so crawlers (search and AI) see full content instead of an empty SPA shell. See the comments in that file and in `wrangler.jsonc` for why.

## Local development

```bash
npm install
npm run dev          # Vite dev server
npm run build        # production build: vite build + prerender
npm run build:spa    # vite build only, no prerender (faster local checks)
npm run check         # tsc --noEmit
```

`npm run build`'s prerender step needs two env vars, `PRERENDER_CF_ACCOUNT_ID`
and `PRERENDER_CF_BROWSER_TOKEN` (a Cloudflare API token scoped to Account →
Browser Rendering → Edit), set as build-time environment variables on the
Workers Builds triggers in production, or in your shell for a local test build.

## Structure

- `client/src/pages/Home.tsx`: the landing page.
- `client/src/pages/{Privacy,Terms,Refunds,Contact}.tsx`: legal and contact pages.
- `client/src/pages/Roadmap.tsx`: the one dashboard-preview sample page promoted to a real, indexed route.
- `client/public/dashboard-preview/*.html`: the other sample-dashboard pages, kept as plain static files (all `noindex`, illustrative data only).
- `worker/index.ts`: the one server-side route this site needs.

## Notes on `client/index.html`

These used to be HTML comments in the `<head>`, which meant they shipped to
every visitor and crawler. They are reference for maintainers, not for the
public, so they live here instead.

- **Google Search Console** is verified by the file at
  `/googlee25309b4cf7bf9f6.html`, so no meta verification token is needed. The
  `msvalidate.01` meta tag next to it is Bing's, which does need one.
- The **Plausible** snippet is account-specific; it is not the generic one from
  their docs, so do not swap it for a copy-paste from elsewhere.
- **Space Grotesk and Space Mono** in the Google Fonts URL are there for
  `/roadmap` and the `dashboard-preview` sample pages, which keep their own
  "product demo" type system. Removing them because the marketing pages do not
  use them would break the sample dashboard.
