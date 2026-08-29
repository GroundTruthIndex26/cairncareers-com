/**
 * prerender.mjs — turns the built SPA into real HTML files, one per route.
 *
 * WHY A REAL BROWSER AND NOT react-dom/server
 * The app reads window, navigator and localStorage during startup. Rendering
 * in a real browser sidesteps auditing every component for SSR safety.
 *
 * WHY CLOUDFLARE BROWSER RENDERING AND NOT A LOCAL PLAYWRIGHT BROWSER
 * This script runs inside Cloudflare Workers Builds, a locked-down, non-root
 * CI container with no apt/sudo access and no Chromium system libraries
 * installed. A locally-launched Playwright browser cannot run there. Instead
 * this script (1) uploads the just-built SPA shell as a throwaway, never-
 * promoted Worker version to get a real public URL, then (2) asks Cloudflare's
 * own remote Browser Rendering service to load each route on that URL and
 * hand back the rendered HTML — the pattern documented at
 * https://developers.cloudflare.com/browser-run/how-to/pre-render-pages/.
 * That public URL is uploaded from wrangler.prerender.jsonc, a single-page-
 * application variant of wrangler.jsonc, so every client-side route (not
 * just "/") resolves to the SPA shell instead of 404ing.
 *
 * main.tsx uses createRoot (not hydrateRoot), so React discards this markup and
 * re-renders on the client. Crawlers read the prerendered HTML; visitors get a
 * normal client render; there is no hydration contract between them.
 *
 * SAFETY
 * The build FAILS if any route in ROUTES does not render. A missing file would
 * become a 404 in production once wrangler serves real 404s.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const ORIGIN = "https://cairncareers.com";

const ACCOUNT_ID = process.env.PRERENDER_CF_ACCOUNT_ID;
const BROWSER_TOKEN = process.env.PRERENDER_CF_BROWSER_TOKEN;

const ROUTES = [
  { path: "/", minBytes: 15000 },
  { path: "/roadmap", minBytes: 15000 },
  { path: "/contact", minBytes: 8000 },
  { path: "/privacy", minBytes: 8000 },
  { path: "/terms", minBytes: 8000 },
  { path: "/refunds", minBytes: 8000 },
  { path: "/404", minBytes: 3000, noindex: true, out: "404.html" },
];

const log = (...a) => console.log("[prerender]", ...a);

function setOrCreateMeta(html, attr, name, content) {
  const re = new RegExp(`<meta\\s+${attr}="${name}"[^>]*>`, "i");
  const tag = `<meta ${attr}="${name}" content="${content}" />`;
  return re.test(html) ? html.replace(re, tag) : html.replace("</head>", `    ${tag}\n  </head>`);
}

function applyPerRouteHead(html, route) {
  const url = route.path === "/" ? `${ORIGIN}/` : `${ORIGIN}${route.path}`;

  html = /<link\s+rel="canonical"[^>]*>/i.test(html)
    ? html.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${url}" />`)
    : html.replace("</head>", `    <link rel="canonical" href="${url}" />\n  </head>`);

  html = html.replace(/<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${url}" />`);

  if (route.noindex) {
    html = setOrCreateMeta(html, "name", "robots", "noindex,follow");
  }
  return html;
}

function uploadPreviewVersion() {
  const configPath = path.join(ROOT, "wrangler.prerender.jsonc");
  if (!fs.existsSync(configPath)) {
    throw new Error(`${configPath} not found — required to crawl client-side routes.`);
  }

  log("uploading throwaway preview version for crawling...");
  const stdout = execFileSync(
    "npx",
    ["wrangler", "versions", "upload", "-c", "wrangler.prerender.jsonc", "--message", "prerender crawl (never promoted)"],
    { cwd: ROOT, encoding: "utf8" },
  );

  const match = stdout.match(/Version Preview URL:\s*(https:\/\/\S+)/);
  if (!match) {
    console.error(stdout);
    throw new Error("could not find a Version Preview URL in `wrangler versions upload` output");
  }
  const previewUrl = match[1];
  log("preview version live at", previewUrl);
  return previewUrl;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function renderContent(url, attempt = 1) {
  let res;
  try {
    res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/browser-rendering/content`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BROWSER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        gotoOptions: { waitUntil: "networkidle0", timeout: 45000 },
      }),
    });
  } catch (err) {
    const maxNetworkAttempts = 3;
    if (attempt >= maxNetworkAttempts) throw err;
    const delayMs = 3000 * attempt;
    log(`network error on ${url} (${err.message}), retrying in ${delayMs}ms (attempt ${attempt}/${maxNetworkAttempts})`);
    await sleep(delayMs);
    return renderContent(url, attempt + 1);
  }

  if (res.status === 429) {
    const maxAttempts = 6;
    if (attempt >= maxAttempts) {
      throw new Error(`Browser Rendering HTTP 429 after ${maxAttempts} attempts (still rate-limited)`);
    }
    const retryAfterHeader = Number(res.headers.get("retry-after"));
    const delayMs = Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
      ? retryAfterHeader * 1000
      : 2000 * 2 ** (attempt - 1);
    log(`rate limited on ${url}, retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts})`);
    await sleep(delayMs);
    return renderContent(url, attempt + 1);
  }

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 500);
    throw new Error(`Browser Rendering HTTP ${res.status}: ${detail}`);
  }

  const data = await res.json();
  if (!data.success || typeof data.result !== "string") {
    throw new Error(`Browser Rendering returned an unsuccessful response: ${JSON.stringify(data.errors ?? data)}`);
  }
  return data.result;
}

async function run() {
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    throw new Error("dist/index.html not found — run `vite build` before prerendering.");
  }
  if (!ACCOUNT_ID || !BROWSER_TOKEN) {
    throw new Error(
      "PRERENDER_CF_ACCOUNT_ID and PRERENDER_CF_BROWSER_TOKEN must be set — this script renders routes via " +
        "Cloudflare Browser Rendering, not a local browser.",
    );
  }

  const previewUrl = uploadPreviewVersion();

  const failures = [];
  const written = [];

  for (const route of ROUTES) {
    try {
      let html = await renderContent(previewUrl + route.path);
      html = "<!doctype html>\n" + html.replace(/^<!doctype html>\s*/i, "");
      html = applyPerRouteHead(html, route);

      if (html.length < route.minBytes) {
        throw new Error(`only ${html.length} bytes, expected at least ${route.minBytes}`);
      }
      if (!/<h1[^>]*>[^<]/.test(html)) {
        throw new Error("no <h1> with text content in the rendered output");
      }
      if (/<div id="root"><\/div>/.test(html)) {
        throw new Error("#root is still empty after render");
      }

      const outPath = route.out
        ? path.join(DIST, route.out)
        : path.join(DIST, route.path === "/" ? "index.html" : `${route.path.replace(/^\//, "")}/index.html`);

      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html, "utf8");
      written.push(`${route.path} -> ${path.relative(DIST, outPath)} (${html.length} bytes)`);
    } catch (err) {
      failures.push(`${route.path}: ${err.message}`);
    }
  }

  written.forEach((w) => log("ok  ", w));

  if (failures.length) {
    console.error("\n[prerender] FAILED — these routes did not render:");
    failures.forEach((f) => console.error("  -", f));
    console.error("\nThe build is stopping on purpose. A missing prerendered file becomes a live 404.\n");
    process.exit(1);
  }

  log(`done — ${written.length} routes prerendered`);
}

run().catch((err) => {
  console.error("[prerender] fatal:", err);
  process.exit(1);
});
