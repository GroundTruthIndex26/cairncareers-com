/**
 * routes.mjs: the indexable routes and the git dates behind them.
 *
 * Shared by scripts/sitemap.mjs (sitemap <lastmod>) and vite.config.ts
 * (datePublished and dateModified in each page's JSON-LD), so the sitemap and
 * the structured data can never disagree about when a page changed.
 *
 * `source` lists the files whose git history dates the route; the newest wins
 * for dateModified and the oldest for datePublished. Home and Methodology keep
 * their copy in the English translation file, so a copy edit there has to
 * move their date too. This needs full history: a shallow clone makes
 * `git log` blind, so CI checks out with fetch-depth 0.
 */

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const ROUTES = [
  { path: "/",        priority: "1.0", changefreq: "weekly",  source: ["client/src/pages/Home.tsx", "client/src/lib/translations/en.ts"] },
  { path: "/roadmap", priority: "0.7", changefreq: "monthly", source: "client/src/pages/Roadmap.tsx" },
  { path: "/methodology", priority: "0.8", changefreq: "monthly", source: ["client/src/pages/Methodology.tsx", "client/src/lib/translations/en.ts"] },
  { path: "/vs/chatgpt", priority: "0.7", changefreq: "monthly", source: "client/src/pages/Compare.tsx" },
  { path: "/vs/careerwing", priority: "0.7", changefreq: "monthly", source: "client/src/pages/Compare.tsx" },
  { path: "/vs/career-mirror", priority: "0.7", changefreq: "monthly", source: "client/src/pages/Compare.tsx" },
  { path: "/vs/maketheleap", priority: "0.7", changefreq: "monthly", source: "client/src/pages/Compare.tsx" },
  { path: "/contact", priority: "0.5", changefreq: "monthly", source: "client/src/pages/Contact.tsx" },
  { path: "/privacy", priority: "0.3", changefreq: "monthly", source: "client/src/pages/Privacy.tsx" },
  { path: "/terms",   priority: "0.3", changefreq: "monthly", source: "client/src/pages/Terms.tsx" },
  { path: "/refunds", priority: "0.3", changefreq: "monthly", source: "client/src/pages/Refunds.tsx" },
];

const git = (args) => {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};

const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);

/** Committer date (YYYY-MM-DD) of the last commit touching any of `files`. */
export function lastModified(files, fallback) {
  const d = git(["log", "-1", "--format=%cs", "--", ...[files].flat()]);
  return isDate(d) ? d : fallback;
}

/** Committer date (YYYY-MM-DD) of the first commit touching any of `files`. */
export function firstPublished(files, fallback) {
  const d = git(["log", "--reverse", "--format=%cs", "--", ...[files].flat()]).split("\n")[0];
  return isDate(d) ? d : fallback;
}

/** { "/route": { published, modified } } for every route in ROUTES. */
export function routeDates() {
  const today = new Date().toISOString().slice(0, 10);
  const repoDate = lastModified(".", today);
  return Object.fromEntries(
    ROUTES.map((r) => [r.path, { published: firstPublished(r.source, repoDate), modified: lastModified(r.source, repoDate) }]),
  );
}
