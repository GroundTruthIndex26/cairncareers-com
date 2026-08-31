/**
 * sitemap.mjs: writes dist/sitemap.xml from what was actually prerendered.
 *
 * WHY THIS IS GENERATED AND NOT A STATIC FILE
 * client/public/sitemap.xml was maintained by hand, so every <lastmod> froze
 * at the day someone last remembered to edit it while the pages kept changing.
 *
 * WHY LASTMOD COMES FROM GIT AND NOT THE BUILD DATE
 * Stamping today's date on every URL at every deploy claims the whole site
 * changed whenever anything deploys, which is noise. Each route's lastmod is
 * the date of the last commit touching that route's source file, so a page's
 * date moves only when that page actually changed. This needs full history:
 * a shallow clone makes `git log` blind, so CI checks out with fetch-depth 0.
 *
 * SAFETY
 * The build FAILS if a listed route was not prerendered, or if an indexable
 * route was prerendered but is missing from ROUTES. Otherwise the sitemap
 * silently drifts from the site, which is exactly the failure being fixed.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const ORIGIN = "https://cairncareers.com";

// `source` is the file whose git history dates the route.
const ROUTES = [
  { path: "/",        priority: "1.0", changefreq: "weekly",  source: "client/src/pages/Home.tsx" },
  { path: "/roadmap", priority: "0.7", changefreq: "monthly", source: "client/src/pages/Roadmap.tsx" },
  { path: "/contact", priority: "0.5", changefreq: "monthly", source: "client/src/pages/Contact.tsx" },
  { path: "/privacy", priority: "0.3", changefreq: "monthly", source: "client/src/pages/Privacy.tsx" },
  { path: "/terms",   priority: "0.3", changefreq: "monthly", source: "client/src/pages/Terms.tsx" },
  { path: "/refunds", priority: "0.3", changefreq: "monthly", source: "client/src/pages/Refunds.tsx" },
];

const log = (...a) => console.log("[sitemap]", ...a);

const git = (args) => {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};

/** Committer date (YYYY-MM-DD) of the last commit touching `file`. */
function lastModified(file, fallback) {
  const d = git(["log", "-1", "--format=%cs", "--", file]);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : fallback;
}

/** Route path for a prerendered file, or null if it is not a route index. */
function routeFor(file) {
  const rel = path.relative(DIST, file);
  if (rel === "index.html") return "/";
  if (rel.endsWith(`${path.sep}index.html`)) return "/" + path.dirname(rel).split(path.sep).join("/");
  return null;
}

function prerenderedRoutes() {
  const found = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "index.html") found.push(p);
    }
  })(DIST);
  return found;
}

function run() {
  if (!fs.existsSync(path.join(DIST, "index.html"))) {
    throw new Error("dist/index.html not found. Run the build before generating the sitemap.");
  }

  // Repo-wide date, used when a route has no source file history yet.
  const repoDate = lastModified(".", new Date().toISOString().slice(0, 10));

  // Every listed route must have actually been prerendered.
  const missing = ROUTES.filter((r) => {
    const f = r.path === "/" ? "index.html" : `${r.path.slice(1)}/index.html`;
    return !fs.existsSync(path.join(DIST, f));
  });
  if (missing.length) {
    throw new Error(`listed in ROUTES but not prerendered: ${missing.map((r) => r.path).join(", ")}`);
  }

  // Anything prerendered and indexable must be listed, or the sitemap drifts.
  const listed = new Set(ROUTES.map((r) => r.path));
  const orphans = prerenderedRoutes()
    .map((f) => ({ route: routeFor(f), html: fs.readFileSync(f, "utf8") }))
    .filter(({ route, html }) => route && !listed.has(route) && !/name="robots"[^>]*noindex/i.test(html))
    .map(({ route }) => route);
  if (orphans.length) {
    throw new Error(`prerendered and indexable but missing from ROUTES: ${orphans.join(", ")}`);
  }

  const urls = ROUTES.map((r) => {
    const loc = r.path === "/" ? `${ORIGIN}/` : `${ORIGIN}${r.path}`;
    const lastmod = lastModified(r.source, repoDate);
    log(`${r.path} -> ${lastmod}`);
    return [
      "  <url>",
      `    <loc>${loc}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${r.changefreq}</changefreq>`,
      `    <priority>${r.priority}</priority>`,
      "  </url>",
    ].join("\n");
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(DIST, "sitemap.xml"), xml);
  log(`wrote dist/sitemap.xml with ${ROUTES.length} urls`);
}

run();
