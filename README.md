# cairncareers.com

The production site for CairnCareers: career-planning context for college
students and recent graduates, built by Phronesis Labs LLC.

## Stack

- **Vite + React + wouter**: client-side app, all marketing/legal pages as real routes.
- **Cloudflare Workers**: static assets plus one small Worker route (`/api/launch-notifications`, `worker/index.ts`), deployed by the GitHub Actions workflow in `.github/workflows/deploy.yml` on every push to `main`.
- **Cloudflare Browser Rendering**: `scripts/prerender.mjs` prerenders every indexable route to real static HTML during the build, so crawlers (search and AI) see full content instead of an empty SPA shell. See the comments in that file and in `wrangler.jsonc` for why.
- **Markdown for agents**: `scripts/markdown.mjs` converts each prerendered page to Markdown after the prerender step, and the Worker serves it to any request with `Accept: text/markdown`. Browsers still get HTML.

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
Browser Rendering → Edit). In production the deploy workflow supplies both from
the `CLOUDFLARE_API_TOKEN` repository secret; set them in your shell for a local
test build.

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
- **Google Fonts** load with `media="print"` and flip to `all` on load, so the
  stylesheet never blocks first paint; `scripts/prerender.mjs` restores that
  form in the captured HTML. **Space Grotesk and Space Mono** are the
  "product demo" type system: `/roadmap` adds them itself in `Roadmap.tsx`,
  and the `dashboard-preview` sample pages carry their own font link.
- **Tag scripts** (GA4, Clarity) and the HeyCatch SDK start after the `load`
  event on an idle callback (`index.html`, `client/src/lib/analytics.ts`), so
  they do not compete with the first paint or hydration.
