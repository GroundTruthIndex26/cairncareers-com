/**
 * Server-side logic: redirecting www to the apex domain, saving the two kinds
 * of message the site collects (launch-notification signups and contact form
 * submissions) to Supabase, emailing each new subscriber a thank-you, and
 * emailing the owner a daily digest of new signups. Everything else is served as static assets
 * via env.ASSETS, which still applies the html_handling and not_found_handling
 * rules configured in wrangler.jsonc.
 *
 * WHY BOTH FORMS POST HERE RATHER THAN STRAIGHT TO SUPABASE
 * The contact form used to call a Supabase Edge Function directly from the
 * browser. That project was deleted, the endpoint began returning 410, and
 * every submission failed silently. Routing through the Worker means the
 * browser never holds a Supabase key, both forms share one credential, and
 * there is no Edge Function to keep deployed.
 */

/** Minimal shape of the Workers rate-limit binding; @cloudflare/workers-types
 * is not a dependency here, and this is the whole surface we use. */
interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  /** Resend API key (Worker secret). When unset, signups are still saved; only the emails are skipped. */
  RESEND_API_KEY?: string;
  /** Where the daily new-signup digest goes (wrangler.jsonc vars). */
  NOTIFY_EMAIL?: string;
  /** Sender for both emails. Must be on a domain verified in Resend (wrangler.jsonc vars). */
  FROM_EMAIL?: string;
  ASSETS: Fetcher;
  API_RATE_LIMITER?: RateLimiter;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Longest value accepted per field, so one request cannot fill the table. */
const MAX = { email: 320, name: 200, subject: 300, message: 5000 };

const str = (body: unknown, key: string): string =>
  typeof (body as Record<string, unknown>)?.[key] === "string"
    ? ((body as Record<string, string>)[key]).trim()
    : "";

/** POST rows to PostgREST with the service-role key. `query` carries upsert options. */
async function insertRows(
  env: Env,
  table: string,
  rows: unknown,
  query = "",
  upsert = false,
): Promise<Response> {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${table}${query}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY as string,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY as string}`,
      "Content-Type": "application/json",
      Prefer: upsert ? "resolution=merge-duplicates,return=minimal" : "return=minimal",
    },
    body: JSON.stringify(rows),
  });
}

/**
 * Contact form. The form carries a hidden `website` field no human ever fills
 * in; when a bot fills it we return the same success shape without writing,
 * so the bot cannot tell it was rejected and the table stays clean.
 */
async function handleContact(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (str(body, "website")) return Response.json({ saved: true }, { status: 201 });

  const email = str(body, "email").toLowerCase();
  const name = str(body, "name");
  const message = str(body, "message");
  const subject = str(body, "subject");

  if (!EMAIL_RE.test(email) || email.length > MAX.email) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!name || name.length > MAX.name) {
    return Response.json({ error: "Enter your name." }, { status: 400 });
  }
  if (!message || message.length > MAX.message) {
    return Response.json({ error: "Enter a message." }, { status: 400 });
  }
  if (subject.length > MAX.subject) {
    return Response.json({ error: "That subject is too long." }, { status: 400 });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Contact delivery is not configured yet." }, { status: 503 });
  }

  try {
    const response = await insertRows(env, "contact_messages", {
      name,
      email,
      subject: subject || null,
      message,
    });
    if (!response.ok) {
      console.error("Supabase contact insert failed", response.status);
      return Response.json({ error: "We could not send your message. Please try again." }, { status: 502 });
    }
    return Response.json({ saved: true }, { status: 201 });
  } catch (error) {
    console.error("Supabase contact request failed", error);
    return Response.json({ error: "We could not send your message. Please try again." }, { status: 502 });
  }
}

/** Shared PostgREST headers for the service-role connection. */
function sbHeaders(env: Env, prefer?: string): Record<string, string> {
  const h: Record<string, string> = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY as string,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY as string}`,
    "Content-Type": "application/json",
  };
  if (prefer) h.Prefer = prefer;
  return h;
}

interface SignupRow {
  id: string;
  email: string;
  source: string | null;
  created_at: string;
}

/**
 * EMAIL
 * Two messages leave this Worker, both through Resend:
 *   1. an immediate thank-you to the subscriber the first time an address signs up;
 *   2. a once-a-day digest to NOTIFY_EMAIL listing signups not yet reported
 *      (see `scheduled` below and the cron in wrangler.jsonc).
 * Neither may ever break a signup. Every send runs after the row is saved,
 * inside ctx.waitUntil, and a failure is logged, not surfaced. Each row records
 * welcomed_at / digested_at so a retry or an overlapping cron cannot double-send.
 */
async function sendEmail(
  env: Env,
  msg: { to: string[]; subject: string; text: string; html?: string; reply_to?: string },
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    console.warn("email skipped: RESEND_API_KEY or FROM_EMAIL is not set");
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.FROM_EMAIL, ...msg }),
  });
  if (!res.ok) console.error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.ok;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

/** The thank-you note a new subscriber receives right after signing up. */
function welcomeEmail(env: Env) {
  const replyTo = env.NOTIFY_EMAIL;
  const lines = [
    "Thanks for joining the CairnCareers launch list.",
    "",
    "CairnCareers helps college students and recent graduates compare realistic career paths using salary, job growth, and how exposed each path is to AI, then leave with a next move they can explain.",
    "",
    "What happens next:",
    "  - We launch on October 31, 2026. You will get one email from us the day it goes live.",
    "  - Until then, pre-order pricing is open: Premium is US$61 for the first year (US$86 after launch) and Pro is US$46 a year. Every purchase carries a 30-day money-back guarantee.",
    "  - We will not send you anything else in between. No drip sequence, no weekly newsletter.",
    "",
    "Have a question, or want to tell us which career paths you are weighing? Reply to this email. A person reads every message.",
    "",
    "If you did not sign up for this, reply with the word REMOVE and we will delete your address.",
    "",
    "Brooke Houck",
    "CairnCareers, a Phronesis Labs LLC product",
    "https://cairncareers.com",
  ];
  const text = lines.join("\n");
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f7f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1b1b1b;line-height:1.55">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px">
<p style="margin:0 0 16px;font-size:20px;font-weight:700">Thanks for joining the CairnCareers launch list.</p>
<p style="margin:0 0 16px">CairnCareers helps college students and recent graduates compare realistic career paths using salary, job growth, and how exposed each path is to AI, then leave with a next move they can explain.</p>
<p style="margin:0 0 8px;font-weight:700">What happens next</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="margin-bottom:6px">We launch on <strong>October 31, 2026</strong>. You will get one email from us the day it goes live.</li>
<li style="margin-bottom:6px">Until then, pre-order pricing is open: Premium is <strong>US$61</strong> for the first year (US$86 after launch) and Pro is US$46 a year. Every purchase carries a 30-day money-back guarantee.</li>
<li>We will not send you anything else in between. No drip sequence, no weekly newsletter.</li>
</ul>
<p style="margin:0 0 16px">Have a question, or want to tell us which career paths you are weighing? Reply to this email. A person reads every message.</p>
<p style="margin:0 0 24px;font-size:13px;color:#555">If you did not sign up for this, reply with the word REMOVE and we will delete your address.</p>
<p style="margin:0;font-size:14px">Brooke Houck<br>CairnCareers, a Phronesis Labs LLC product<br><a href="https://cairncareers.com" style="color:#1b1b1b">cairncareers.com</a></p>
</div></body></html>`;
  return { subject: "You are on the CairnCareers launch list", text, html, reply_to: replyTo };
}

/** Send the welcome email for one new row, then stamp welcomed_at so it is never sent twice. */
async function welcomeNewSignup(env: Env, row: SignupRow): Promise<void> {
  try {
    const ok = await sendEmail(env, { to: [row.email], ...welcomeEmail(env) });
    if (!ok) return;
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/launch_notifications?id=eq.${row.id}`, {
      method: "PATCH",
      headers: sbHeaders(env, "return=minimal"),
      body: JSON.stringify({ welcomed_at: new Date().toISOString() }),
    });
    if (!res.ok) console.error("welcomed_at stamp failed", res.status);
  } catch (error) {
    console.error("welcome email failed", error);
  }
}

async function handleLaunchNotifications(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof (body as { email?: unknown })?.email === "string"
    ? (body as { email: string }).email.trim().toLowerCase()
    : "";
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Launch notifications are not configured yet." }, { status: 503 });
  }

  try {
    // ignore-duplicates + return=representation: a brand-new address comes back
    // as [row]; an address already on the list comes back as []. That is how we
    // know whether to send the thank-you without a second round trip, and it
    // keeps a repeat signup from overwriting the original created_at.
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/launch_notifications?on_conflict=email`, {
      method: "POST",
      headers: sbHeaders(env, "resolution=ignore-duplicates,return=representation"),
      body: JSON.stringify({ email, source: "launch-notification" }),
    });

    if (!response.ok) {
      console.error("Supabase launch-notification insert failed", response.status);
      return Response.json({ error: "We could not save your notification request. Please try again." }, { status: 502 });
    }

    const rows = (await response.json().catch(() => [])) as SignupRow[];
    if (rows.length === 1) ctx.waitUntil(welcomeNewSignup(env, rows[0]));

    return Response.json({ saved: true }, { status: 201 });
  } catch (error) {
    console.error("Supabase launch-notification request failed", error);
    return Response.json({ error: "We could not save your notification request. Please try again." }, { status: 502 });
  }
}

/**
 * DAILY DIGEST (cron in wrangler.jsonc)
 * Collects every signup not yet reported, emails the list to NOTIFY_EMAIL, and
 * stamps digested_at on exactly those rows. Selecting on the stamp rather than
 * on "the last 24 hours" means a missed or late run reports everything it
 * skipped instead of losing it, and nothing is ever reported twice. On a day
 * with no new signups it sends nothing at all.
 */
async function sendDailyDigest(env: Env): Promise<void> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("digest skipped: Supabase is not configured");
    return;
  }
  if (!env.NOTIFY_EMAIL) {
    console.warn("digest skipped: NOTIFY_EMAIL is not set");
    return;
  }

  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/launch_notifications?select=id,email,source,created_at&digested_at=is.null&order=created_at.asc&limit=500`,
    { headers: sbHeaders(env) },
  );
  if (!res.ok) {
    console.error("digest query failed", res.status);
    return;
  }
  const rows = (await res.json()) as SignupRow[];
  if (rows.length === 0) {
    console.log("digest: no new signups");
    return;
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" });
  const n = rows.length;
  const subject = `CairnCareers: ${n} new launch-list signup${n === 1 ? "" : "s"}`;
  const text = [
    `${n} new signup${n === 1 ? "" : "s"} since the last digest.`,
    "",
    ...rows.map((r) => `${fmt(r.created_at)} ET   ${r.email}`),
    "",
    "Times are US Eastern. Full table: Supabase → Cairn Careers → launch_notifications.",
  ].join("\n");
  const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1b1b1b;line-height:1.5;padding:16px">
<p style="margin:0 0 12px;font-size:16px"><strong>${n} new signup${n === 1 ? "" : "s"}</strong> since the last digest.</p>
<table style="border-collapse:collapse;font-size:14px">
<tr><th style="text-align:left;padding:4px 12px 4px 0;border-bottom:1px solid #ddd">When (ET)</th><th style="text-align:left;padding:4px 0;border-bottom:1px solid #ddd">Email</th></tr>
${rows.map((r) => `<tr><td style="padding:4px 12px 4px 0;white-space:nowrap">${esc(fmt(r.created_at))}</td><td style="padding:4px 0">${esc(r.email)}</td></tr>`).join("")}
</table>
<p style="margin:16px 0 0;font-size:12px;color:#555">Full table: Supabase → Cairn Careers → launch_notifications.</p>
</body></html>`;

  const ok = await sendEmail(env, { to: [env.NOTIFY_EMAIL], subject, text, html });
  if (!ok) return;

  const ids = rows.map((r) => r.id).join(",");
  const stamp = await fetch(`${env.SUPABASE_URL}/rest/v1/launch_notifications?id=in.(${ids})`, {
    method: "PATCH",
    headers: sbHeaders(env, "return=minimal"),
    body: JSON.stringify({ digested_at: new Date().toISOString() }),
  });
  if (!stamp.ok) console.error("digested_at stamp failed", stamp.status);
  else console.log(`digest: reported ${n} signup(s)`);
}

/**
 * SECURITY HEADERS
 * The site previously sent none of these, so a browser had no instruction to
 * refuse framing, to stop sniffing declared content types, or to limit where
 * scripts may be loaded from.
 *
 * WHY THE CSP ALLOWS 'unsafe-inline' FOR SCRIPTS
 * The prerendered pages carry inline JSON-LD and the inline analytics
 * bootstrap, and the sample pages carry inline behaviour scripts. Nonces
 * cannot be applied to static HTML that is generated at build time and then
 * served from cache, so the honest choice is 'unsafe-inline' plus a strict
 * source allowlist. That does NOT stop an injected inline script, but it does
 * stop an injected script from LOADING code from an attacker's domain, and it
 * blocks framing, plugins, form hijacking and base-tag rewriting outright.
 *
 * WHY HSTS OMITS `preload`
 * Adding the domain to the browser preload list is effectively permanent and
 * removal takes months. A one-year max-age gives the protection; preload is a
 * commitment the site owner should make deliberately, not a side effect.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "script-src 'self' 'unsafe-inline' https://plausible.io https://www.googletagmanager.com https://*.google-analytics.com https://*.clarity.ms https://static.cloudflareinsights.com",
  "connect-src 'self' https://plausible.io https://*.google-analytics.com https://*.analytics.google.com https://*.clarity.ms https://cloudflareinsights.com",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CSP,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

/**
 * CACHING
 * Every asset was served `max-age=0, must-revalidate`, so a returning visitor
 * revalidated the hashed JS and CSS bundles and the 242 KB hero image on every
 * navigation. Vite fingerprints everything under /assets/, so those filenames
 * change whenever their contents do and can be cached permanently. Files under
 * /media and /brand keep their names across edits, so they get a day of
 * freshness plus a week of stale-while-revalidate rather than immutability.
 * HTML keeps must-revalidate: prerendered pages change without changing URL.
 */
function cacheControlFor(pathname: string): string | null {
  if (pathname.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  if (pathname.startsWith("/media/") || pathname.startsWith("/brand/")) {
    return "public, max-age=86400, stale-while-revalidate=604800";
  }
  if (/\.(txt|xml)$/.test(pathname)) return "public, max-age=3600";
  return null;
}

/** Copy a response so its headers can be edited; 204/304 carry no body. */
function withHeaders(response: Response, pathname: string): Response {
  const body = response.status === 204 || response.status === 304 ? null : response.body;
  const out = new Response(body, response);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  const cache = cacheControlFor(pathname);
  if (cache) out.headers.set("Cache-Control", cache);
  return out;
}

/** Security headers belong on API JSON too, but never its cache policy. */
function secured(response: Response): Response {
  const out = new Response(response.body, response);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  out.headers.set("Cache-Control", "no-store");
  return out;
}

/**
 * ABUSE LIMIT
 * Both endpoints write to Supabase, and neither had any limit, so a single
 * client could insert rows as fast as it could open connections. The honeypot
 * only catches bots that fill hidden fields. Keyed on the client IP that
 * Cloudflare resolves, which the client cannot forge at the edge.
 */
async function rateLimited(request: Request, env: Env): Promise<boolean> {
  if (!env.API_RATE_LIMITER) return false;
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  try {
    const { success } = await env.API_RATE_LIMITER.limit({ key: ip });
    return !success;
  } catch (error) {
    // A limiter outage must not take the forms down with it.
    console.error("rate limiter unavailable", error);
    return false;
  }
}

/** Reject oversized posts before parsing rather than after. */
const MAX_BODY_BYTES = 32 * 1024;
function tooLarge(request: Request): boolean {
  const declared = Number(request.headers.get("Content-Length"));
  return Number.isFinite(declared) && declared > MAX_BODY_BYTES;
}

/**
 * Both cairncareers.com and www.cairncareers.com are custom domains on this
 * Worker, so without this the whole site answers 200 on both hostnames, a
 * duplicate-content signal that the canonical tags mitigate but do not remove.
 * A 301 to the apex makes the canonical host unambiguous. Path and query are
 * preserved so deep links keep working.
 */
function apexRedirect(url: URL): Response | null {
  if (url.hostname !== "www.cairncareers.com") return null;
  const target = new URL(url);
  target.hostname = "cairncareers.com";
  return Response.redirect(target.toString(), 301);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const redirect = apexRedirect(url);
    if (redirect) return redirect;

    const isWrite =
      request.method === "POST" &&
      (url.pathname === "/api/launch-notifications" || url.pathname === "/api/contact");

    if (isWrite) {
      if (tooLarge(request)) {
        return secured(Response.json({ error: "That request is too large." }, { status: 413 }));
      }
      if (await rateLimited(request, env)) {
        return secured(
          Response.json({ error: "Too many requests. Please wait a moment and try again." }, { status: 429 }),
        );
      }
      const response =
        url.pathname === "/api/contact"
          ? await handleContact(request, env)
          : await handleLaunchNotifications(request, env, ctx);
      return secured(response);
    }

    // Any other /api/* path (or a non-POST on this one) falls through to assets,
    // which will 404 it via not_found_handling. There's nothing else to serve here.
    return withHeaders(await env.ASSETS.fetch(request), url.pathname);
  },

  /** Runs on the cron schedule in wrangler.jsonc. */
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(sendDailyDigest(env));
  },
} satisfies ExportedHandler<Env>;
