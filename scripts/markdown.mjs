/**
 * markdown.mjs: writes a Markdown copy of every prerendered route.
 *
 * WHY
 * AI agents that send `Accept: text/markdown` would otherwise have to scrape
 * the full HTML page (header, icons, scripts, class soup) to get at the copy.
 * The Worker (serveMarkdown in worker/index.ts) answers those requests with
 * the file written here, and browsers keep getting HTML. This is the same
 * idea as Cloudflare's zone-level "Markdown for Agents" setting, done at build
 * time so it works on any plan and the output is reviewable in the build.
 *
 * WHERE THE FILES GO
 * One file per route in scripts/routes.mjs, at the llms.txt convention's URL:
 * "/" -> dist/index.md, "/vs/chatgpt" -> dist/vs/chatgpt.md. They are also
 * reachable directly at those URLs.
 *
 * Runs after scripts/prerender.mjs, from the prerendered HTML, so the Markdown
 * always says what the page says. The build FAILS if a route has no HTML or
 * converts to almost nothing.
 *
 * Usage: node scripts/markdown.mjs [distDir]   (default: dist)
 */

import fs from "node:fs";
import path from "node:path";
import { parse } from "node-html-parser";
import { NodeHtmlMarkdown } from "node-html-markdown";
import { ROOT, ROUTES } from "./routes.mjs";

const DIST = path.resolve(ROOT, process.argv[2] ?? "dist");
const ORIGIN = "https://cairncareers.com";
const MIN_CHARS = 400;

const log = (...a) => console.log("[markdown]", ...a);

/**
 * Removed before conversion: the site header and breadcrumb (the same on every
 * page, and the breadcrumb only repeats the title), anything decorative or
 * interactive, and anything hidden from assistive tech. The footer stays: it
 * carries the contact address and the links to the other pages.
 */
const DROP = [
  "script",
  "style",
  "noscript",
  "template",
  "svg",
  "form",
  "button",
  "iframe",
  "dialog",
  "header",
  'nav[aria-label*="readcrumb"]',
  // The in-page table of contents repeats the section headings.
  'aside[aria-label="Table of contents"]',
  '[aria-hidden="true"]',
  "[hidden]",
  'img[alt=""]',
  "img:not([alt])",
];

const nhm = new NodeHtmlMarkdown({ bulletMarker: "-", codeBlockStyle: "fenced", maxConsecutiveNewlines: 2 });

const htmlPathFor = (route) => path.join(DIST, route === "/" ? "index.html" : `${route.slice(1)}/index.html`);
const mdPathFor = (route) => path.join(DIST, route === "/" ? "index.md" : `${route.slice(1)}.md`);

/** YAML-safe double-quoted scalar. */
const yaml = (s) => JSON.stringify(s ?? "");

function toMarkdown(html, route) {
  const doc = parse(html, { comment: false });
  const title = doc.querySelector("title")?.text.trim() ?? "";
  const description = doc.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";
  const url = route === "/" ? `${ORIGIN}/` : `${ORIGIN}${route}`;

  const root = doc.querySelector("#root");
  if (!root) throw new Error("no #root in the prerendered HTML");
  for (const selector of DROP) root.querySelectorAll(selector).forEach((el) => el.remove());

  // The page's layout (flex rows, badges, the footer's link groups) separates
  // many sibling elements with CSS alone, so their text would run together:
  // "Last updated</b><time>August" -> "Last updatedAugust". A space between
  // any two elements with nothing between them fixes that; Markdown collapses
  // the extra ones.
  for (const el of root.querySelectorAll("*")) {
    const next = el.nextSibling;
    if (next && next.nodeType === 1 && !["TR", "TD", "TH", "LI", "THEAD", "TBODY"].includes(el.tagName)) {
      el.insertAdjacentHTML("afterend", " ");
    }
  }

  // A GFM table cannot carry a caption, and the converter prints one glued to
  // the header row, so move it above the table as its own paragraph.
  for (const caption of root.querySelectorAll("table > caption")) {
    caption.parentNode.insertAdjacentHTML("beforebegin", `<p><strong>${caption.innerHTML}</strong></p>`);
    caption.remove();
  }

  // Relative links and images would resolve against nothing once the text
  // leaves the page, so make them absolute.
  for (const el of root.querySelectorAll("a[href], img[src]")) {
    const attr = el.tagName === "A" ? "href" : "src";
    const value = el.getAttribute(attr);
    if (value && !/^(https?:|mailto:|tel:|#)/i.test(value)) el.setAttribute(attr, new URL(value, url).toString());
    if (attr === "href" && value?.startsWith("#")) el.setAttribute(attr, `${url}${value}`);
  }

  const body = nhm
    .translate(root.innerHTML)
    // Empty headings and links left behind by removed icons.
    .replace(/^#{1,6}\s*$/gm, "")
    .replace(/\[\s*\]\([^)]*\)/g, "")
    // Stray single spaces at line ends (a double space is a line break).
    .replace(/(\S) $/gm, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const front = ["---", `title: ${yaml(title)}`, `description: ${yaml(description)}`, `url: ${yaml(url)}`, "---"].join("\n");
  return `${front}\n\n${body}\n`;
}

function run() {
  const failures = [];
  for (const { path: route } of ROUTES) {
    try {
      const htmlPath = htmlPathFor(route);
      if (!fs.existsSync(htmlPath)) throw new Error(`${path.relative(DIST, htmlPath)} not found`);
      const md = toMarkdown(fs.readFileSync(htmlPath, "utf8"), route);
      if (md.length < MIN_CHARS) throw new Error(`only ${md.length} characters of Markdown`);
      const out = mdPathFor(route);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, md, "utf8");
      log("ok  ", `${route} -> ${path.relative(DIST, out)} (${md.length} chars)`);
    } catch (err) {
      failures.push(`${route}: ${err.message}`);
    }
  }
  if (failures.length) {
    console.error("\n[markdown] FAILED:");
    failures.forEach((f) => console.error("  -", f));
    process.exit(1);
  }
}

run();
