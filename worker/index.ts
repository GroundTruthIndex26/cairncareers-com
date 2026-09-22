/**
 * Server-side logic: redirecting www to the apex domain, saving the two kinds
 * of message the site collects (launch-notification signups and contact form
 * submissions) to Supabase, emailing each new subscriber or beta requester an
 * acknowledgment, alerting the owner the moment someone signs up, and emailing
 * the owner a daily count of signups. Everything else is served as static assets
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

import { geoForCountry } from "../client/src/lib/geo";

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
  /** Reply-to on the subscriber welcome email (wrangler.jsonc vars). */
  NOTIFY_EMAIL?: string;
  /** Where the instant new-signup alert goes (wrangler.jsonc vars). */
  OWNER_EMAIL?: string;
  /** Sender for both emails. Must be on a domain verified in Resend (wrangler.jsonc vars). */
  FROM_EMAIL?: string;
  /** One-line company mailing address, printed under every subscriber email (CAN-SPAM). wrangler.jsonc vars. */
  POSTAL_ADDRESS?: string;
  /** Where a beta user signs in. Linked from the "your account is ready" email; while empty that email never sends. wrangler.jsonc vars. */
  APP_URL?: string;
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
  /** Null until the automated acknowledgment has been sent for this address. */
  welcomed_at: string | null;
  /** Set by /api/unsubscribe. No automated email is ever sent to an address with this stamped. */
  unsubscribed_at?: string | null;
  /** Set by hand (Supabase table editor or SQL) once the beta account exists. Triggers the account-ready email. */
  account_ready_at?: string | null;
  /** Stamped by the Worker after Resend accepts the account-ready email, so it is sent once. */
  account_ready_sent_at?: string | null;
}

/**
 * EMAIL
 * On a new signup, two messages leave this Worker through Resend:
 *   1. an automated acknowledgment to the person the first time an address is
 *      seen: the launch-list welcome for a notify-me signup, or the beta
 *      acknowledgment for a beta-access request;
 *   2. an immediate alert to OWNER_EMAIL naming the address that just joined.
 * The daily count that used to run on the 13:00 UTC cron was removed on
 * 2026-09-22: the 8am Eastern recap from the AI Job Risk Check project now
 * covers Cairn signups in more detail, and two daily emails was one too many.
 * No per-signup send may ever break a signup. Every send runs after the row is
 * saved, inside ctx.waitUntil, and a failure is logged, not surfaced. The
 * acknowledgment stamps welcomed_at, so it is never sent to one address twice;
 * the owner alert fires on the returned row.
 */
async function sendEmail(
  env: Env,
  msg: { to: string[]; subject: string; text: string; html?: string; reply_to?: string; headers?: Record<string, string> },
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

/**
 * Shared HTML frame for the two subscriber emails: ink header with the cairn
 * mark and wordmark, paper card, lime rule, signature footer. Inline styles and
 * table-free block layout so it renders in Gmail, Apple Mail, and Outlook. The
 * mark is a hosted PNG (SVG is stripped by most mail clients); alt text covers
 * clients that block images.
 */
function emailFrame(env: Env, headline: string, body: string, unsubUrl: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f0ead7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b0d0c;line-height:1.55">
<div style="padding:24px 12px">
<div style="max-width:560px;margin:0 auto;background:#fbf8ed;border-radius:12px;overflow:hidden;border:1px solid #ddd7c5">
<div style="background:#0b0d0c;padding:20px 28px;border-bottom:4px solid #b7ff38">
<a href="https://cairncareers.com" style="text-decoration:none;display:inline-block">
<img src="https://cairncareers.com/brand/cairn-icon-256.png" width="40" height="40" alt="CairnCareers" style="display:inline-block;vertical-align:middle;border:0;margin-right:12px">
<span style="display:inline-block;vertical-align:middle;color:#ffffff;font-family:Arial Black,Arial,Helvetica,sans-serif;font-size:24px;font-weight:900;letter-spacing:-1px">Cairn</span><span style="display:inline-block;vertical-align:middle;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:3px;margin-left:6px">CAREERS</span>
</a>
</div>
<div style="padding:32px 28px">
<p style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.3">${headline}</p>
${body}
<p style="margin:0 0 16px">Have a question, or want to tell us which career paths you are weighing? Reply to this email. A person reads every message.</p>
<div style="border-top:2px solid #b7ff38;padding-top:16px;font-size:14px">Brooke Houck<br>CairnCareers, a Phronesis Labs LLC product<br><a href="https://cairncareers.com" style="color:#0b0d0c;font-weight:700">cairncareers.com</a></div>
</div>
</div>
<div style="max-width:560px;margin:20px auto 0;text-align:center;font-size:12px;color:#5c635e;line-height:1.6">
<p style="margin:0 0 12px">You are receiving this because you entered your email at cairncareers.com.</p>
<p style="margin:0 0 12px"><a href="${unsubUrl}" style="display:inline-block;padding:8px 18px;border:1px solid #5c635e;border-radius:6px;color:#0b0d0c;text-decoration:none;font-weight:700">Unsubscribe</a></p>
<p style="margin:0">Phronesis Labs LLC${env.POSTAL_ADDRESS ? `<br>${esc(env.POSTAL_ADDRESS)}` : ""}</p>
</div>
</div></body></html>`;
}

/** Plain-text closing shared by both subscriber emails: signature, unsubscribe link, mailing address. */
function textFooter(env: Env, unsubUrl: string): string[] {
  return [
    "Brooke Houck",
    "CairnCareers, a Phronesis Labs LLC product",
    "https://cairncareers.com",
    "",
    "You are receiving this because you entered your email at cairncareers.com.",
    `Unsubscribe any time: ${unsubUrl}`,
    "",
    ["Phronesis Labs LLC", env.POSTAL_ADDRESS].filter(Boolean).join(", "),
  ];
}

/** RFC 8058 headers so Gmail and Apple Mail show their own unsubscribe control. */
function unsubHeaders(unsubUrl: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * Unsubscribe links are signed so nobody can remove an address by guessing it.
 * token = first 32 hex chars of HMAC-SHA256(lowercased email, service-role key).
 * Same scheme as the AI Job Risk Check email-unsubscribe function.
 */
async function unsubToken(env: Env, email: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.SUPABASE_SERVICE_ROLE_KEY ?? ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email.toLowerCase()));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

async function unsubscribeUrl(env: Env, email: string): Promise<string> {
  const token = await unsubToken(env, email);
  return `https://cairncareers.com/api/unsubscribe?e=${encodeURIComponent(email.toLowerCase())}&t=${token}`;
}

const ABOUT =
  "CairnCareers helps college students and recent graduates compare realistic career paths using salary, job growth, and how exposed each path is to AI, then leave with a next move they can explain.";

/** The thank-you note a new subscriber receives right after signing up. */
function welcomeEmail(env: Env, unsubUrl: string) {
  const replyTo = env.NOTIFY_EMAIL;
  const lines = [
    "Thanks for joining the CairnCareers launch list.",
    "",
    ABOUT,
    "",
    "What happens next:",
    "  - We launch on October 31, 2026. You will get one email from us the day it goes live.",
    "  - Until then, beta access is free. Request it at https://cairncareers.com/#beta-access and we will email you when your account is ready.",
    "",
    "Have a question, or want to tell us which career paths you are weighing? Reply to this email. A person reads every message.",
    "",
    ...textFooter(env, unsubUrl),
  ];
  const text = lines.join("\n");
  const html = emailFrame(
    env,
    "Thanks for joining the CairnCareers launch list.",
    `<p style="margin:0 0 16px">${ABOUT}</p>
<p style="margin:0 0 8px;font-weight:700">What happens next</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="margin-bottom:6px">We launch on <strong>October 31, 2026</strong>. You will get one email from us the day it goes live.</li>
<li>Until then, beta access is free. <a href="https://cairncareers.com/#beta-access" style="color:#0b0d0c;font-weight:700">Request it here</a> and we will email you when your account is ready.</li>
</ul>`,
    unsubUrl,
  );
  return { subject: "You are on the CairnCareers launch list", text, html, reply_to: replyTo, headers: unsubHeaders(unsubUrl) };
}

/** The acknowledgment a new beta-access requester receives right after asking. */
function betaAckEmail(env: Env, unsubUrl: string) {
  const replyTo = env.NOTIFY_EMAIL;
  const lines = [
    "You are in. CairnCareers is free for you for one year.",
    "",
    "Thanks for requesting beta access. As a beta user, you get CairnCareers free from the day your account opens until October 31, 2027, one year after the public launch. No card, no trial clock, nothing to cancel.",
    "",
    ABOUT,
    "",
    "What happens next:",
    "  - We will email you the moment your beta account is ready. Nothing else is needed from you right now.",
    "  - We launch publicly on October 31, 2026. Your beta access carries through launch and for one year after the public launch.",
    "",
    "Have a question, or want to tell us which career paths you are weighing? Reply to this email. A person reads every message.",
    "",
    ...textFooter(env, unsubUrl),
  ];
  const text = lines.join("\n");
  const html = emailFrame(
    env,
    "You are in. CairnCareers is free for you for one year.",
    `<div style="background:#0b0d0c;color:#b7ff38;border-radius:8px;padding:14px 18px;margin:0 0 20px;font-weight:700;font-size:15px">Beta perk: CairnCareers is free for you from the day your account opens until October 31, 2027, one year after the public launch. No card, no trial clock, nothing to cancel.</div>
<p style="margin:0 0 16px">Thanks for requesting beta access. ${ABOUT}</p>
<p style="margin:0 0 8px;font-weight:700">What happens next</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="margin-bottom:6px">We will email you the moment your beta account is ready. Nothing else is needed from you right now.</li>
<li>We launch publicly on <strong>October 31, 2026</strong>. Your beta access carries through launch and for one year after the public launch.</li>
</ul>`,
    unsubUrl,
  );
  return { subject: "You are in: one free year of CairnCareers", text, html, reply_to: replyTo, headers: unsubHeaders(unsubUrl) };
}

/** The note a beta user receives once their account exists and they can sign in. */
function accountReadyEmail(env: Env, unsubUrl: string) {
  const replyTo = env.NOTIFY_EMAIL;
  const appUrl = env.APP_URL as string;
  const lines = [
    "Your CairnCareers beta account is ready.",
    "",
    "You asked for beta access, and your account is open. Sign in with this email address, the one this note was sent to.",
    "",
    `Sign in: ${appUrl}`,
    "",
    "What you get as a beta user:",
    "  - CairnCareers is free for you until October 31, 2027, one year after the public launch. No card, no trial clock, nothing to cancel.",
    "  - Compare the career paths you are weighing on salary, job growth, and how exposed each is to AI, then leave with a next move you can explain.",
    "  - You are using it before anyone else. If something is confusing, slow, or wrong, reply and tell us. Beta feedback shapes what we fix first.",
    "",
    "Have a question, or want to tell us which career paths you are weighing? Reply to this email. A person reads every message.",
    "",
    ...textFooter(env, unsubUrl),
  ];
  const text = lines.join("\n");
  const html = emailFrame(
    env,
    "Your CairnCareers beta account is ready.",
    `<p style="margin:0 0 20px">You asked for beta access, and your account is open. Sign in with this email address, the one this note was sent to.</p>
<p style="margin:0 0 24px"><a href="${appUrl}" style="display:inline-block;background:#b7ff38;color:#0b0d0c;font-weight:700;font-size:16px;padding:14px 28px;border-radius:8px;text-decoration:none">Sign in to CairnCareers</a></p>
<p style="margin:0 0 8px;font-weight:700">What you get as a beta user</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li style="margin-bottom:6px">CairnCareers is free for you until <strong>October 31, 2027</strong>, one year after the public launch. No card, no trial clock, nothing to cancel.</li>
<li style="margin-bottom:6px">Compare the career paths you are weighing on salary, job growth, and how exposed each is to AI, then leave with a next move you can explain.</li>
<li>You are using it before anyone else. If something is confusing, slow, or wrong, reply and tell us. Beta feedback shapes what we fix first.</li>
</ul>
<p style="margin:0 0 16px;font-size:13px;color:#5c635e">If the button does not work, open this link: <a href="${appUrl}" style="color:#0b0d0c">${appUrl}</a></p>`,
    unsubUrl,
  );
  return { subject: "Your CairnCareers beta account is ready", text, html, reply_to: replyTo, headers: unsubHeaders(unsubUrl) };
}

/**
 * ACCOUNT-READY EMAILS
 * Provisioning is manual. Once an account exists, set account_ready_at on the
 * row (Supabase table editor, or SQL). Every 15 minutes the cron picks up rows
 * with account_ready_at set, account_ready_sent_at null, and no unsubscribe,
 * sends the note, and stamps account_ready_sent_at so it goes out once.
 */
async function sendAccountReadyEmails(env: Env): Promise<void> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return;
  // The beta app is not built yet. Until APP_URL points at it, nothing is
  // sent, whatever account_ready_at says. See docs/ideas/beta-account-ready-email.md.
  if (!env.APP_URL) return;
  let rows: SignupRow[] = [];
  try {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/launch_notifications?account_ready_at=not.is.null&account_ready_sent_at=is.null&unsubscribed_at=is.null&select=id,email,source,created_at,welcomed_at&order=account_ready_at.asc&limit=50`,
      { headers: sbHeaders(env) },
    );
    if (!res.ok) {
      console.error("account-ready query failed", res.status);
      return;
    }
    rows = (await res.json()) as SignupRow[];
  } catch (error) {
    console.error("account-ready query failed", error);
    return;
  }
  for (const row of rows) {
    try {
      const unsubUrl = await unsubscribeUrl(env, row.email);
      const ok = await sendEmail(env, { to: [row.email], ...accountReadyEmail(env, unsubUrl) });
      if (!ok) continue;
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/launch_notifications?id=eq.${row.id}`, {
        method: "PATCH",
        headers: sbHeaders(env, "return=minimal"),
        body: JSON.stringify({ account_ready_sent_at: new Date().toISOString() }),
      });
      if (!res.ok) console.error("account_ready_sent_at stamp failed", row.id, res.status);
      else console.log(`account-ready sent to ${row.email}`);
      // Resend allows two requests a second; space the sends out.
      if (rows.length > 1) await new Promise((r) => setTimeout(r, 600));
    } catch (error) {
      console.error("account-ready send failed", row.id, error);
    }
  }
}

/**
 * Send the automated acknowledgment for one new row, then stamp welcomed_at so
 * it is never sent to the same address twice. The launch-list welcome goes to a
 * notify-me signup; the beta acknowledgment goes to a beta-access request.
 */
async function sendSignupEmail(env: Env, row: SignupRow): Promise<void> {
  try {
    if (row.unsubscribed_at) return;
    const unsubUrl = await unsubscribeUrl(env, row.email);
    const message = row.source === "beta-request" ? betaAckEmail(env, unsubUrl) : welcomeEmail(env, unsubUrl);
    const ok = await sendEmail(env, { to: [row.email], ...message });
    if (!ok) return;
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/launch_notifications?id=eq.${row.id}`, {
      method: "PATCH",
      headers: sbHeaders(env, "return=minimal"),
      body: JSON.stringify({ welcomed_at: new Date().toISOString() }),
    });
    if (!res.ok) console.error("welcomed_at stamp failed", res.status);
  } catch (error) {
    console.error("signup acknowledgment failed", error);
  }
}

async function handleLaunchNotifications(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = str(body, "email").toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  // Two forms post here: the launch-notification modal and the beta-access
  // form on the home page. Anything else claimed as a source is ignored.
  const isBeta = str(body, "source") === "beta-request";
  const source = isBeta ? "beta-request" : "launch-notification";

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Launch notifications are not configured yet." }, { status: 503 });
  }

  try {
    // ignore-duplicates + return=representation: a brand-new address comes back
    // as [row]; an address already on the list comes back as []. That is how we
    // know whether to send the thank-you without a second round trip, and it
    // keeps a repeat signup from overwriting the original created_at.
    //
    // A beta request merges instead: an address already on the launch list is
    // moved to the beta list (only `source` changes; created_at is kept) and the
    // row always comes back, so the owner hears about every request.
    const resolution = isBeta ? "merge-duplicates" : "ignore-duplicates";
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/launch_notifications?on_conflict=email`, {
      method: "POST",
      headers: sbHeaders(env, `resolution=${resolution},return=representation`),
      body: JSON.stringify({ email, source }),
    });

    if (!response.ok) {
      console.error("Supabase launch-notification insert failed", response.status);
      return Response.json({ error: "We could not save your notification request. Please try again." }, { status: 502 });
    }

    const rows = (await response.json().catch(() => [])) as SignupRow[];
    if (rows.length === 1) {
      const row = rows[0];
      // welcomed_at guards the acknowledgment: a launch row is only returned
      // when new, but a beta merge returns the row on every submit, so this
      // keeps a repeat beta request from acknowledging the same person twice.
      if (!row.welcomed_at) ctx.waitUntil(sendSignupEmail(env, row));
      ctx.waitUntil(alertOwnerOfSignup(env, row));
    }

    return Response.json({ saved: true }, { status: 201 });
  } catch (error) {
    console.error("Supabase launch-notification request failed", error);
    return Response.json({ error: "We could not save your notification request. Please try again." }, { status: 502 });
  }
}

/**
 * BETA COUNT
 * The number beside the beta form on the home page: how many addresses have
 * asked for beta access. Read with a HEAD request and count=exact, so no row
 * and no email address ever leaves Supabase, only the total.
 *
 * Below BETA_COUNT_FLOOR the answer is null and the page shows no counter. A
 * single-digit count reads as an empty room, and it would also let anyone
 * watch individual signups arrive one at a time.
 *
 * The edge cache holds the answer for ten minutes, so page views do not turn
 * into Supabase queries one for one.
 */
const BETA_COUNT_FLOOR = 10;
const BETA_COUNT_TTL_SECONDS = 600;

async function handleBetaCount(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(new URL("/api/beta-count", request.url).toString());
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let count: number | null = null;
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const response = await fetch(
        `${env.SUPABASE_URL}/rest/v1/launch_notifications?source=eq.beta-request&select=id`,
        { method: "HEAD", headers: sbHeaders(env, "count=exact") },
      );
      // Content-Range looks like "0-24/57", or "*/0" for an empty table.
      const total = Number(response.headers.get("Content-Range")?.split("/")[1]);
      if (response.ok && Number.isFinite(total) && total >= BETA_COUNT_FLOOR) count = total;
    } catch (error) {
      console.error("Supabase beta count failed", error);
    }
  }

  const out = Response.json({ count });
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
  out.headers.set("Cache-Control", `public, max-age=${BETA_COUNT_TTL_SECONDS}`);
  ctx.waitUntil(cache.put(cacheKey, out.clone()));
  return out;
}

/**
 * INSTANT OWNER ALERT
 * Fires on the insert that actually created a row, so one address joining twice
 * never alerts twice. Runs inside ctx.waitUntil after the row is saved: a send
 * failure is logged and never reaches the person signing up.
 */
async function alertOwnerOfSignup(env: Env, row: SignupRow): Promise<void> {
  if (!env.OWNER_EMAIL) {
    console.warn("owner alert skipped: OWNER_EMAIL is not set");
    return;
  }
  try {
    const when = new Date(row.created_at).toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });
    const isBeta = row.source === "beta-request";
    const what = isBeta ? "just requested beta access to CairnCareers." : "just joined the CairnCareers launch list.";
    const text = [
      `${row.email} ${what}`,
      "",
      `Signed up: ${when} ET`,
      `Source:    ${row.source ?? "launch-notification"}`,
      "",
      "Full table: Supabase -> Cairn Careers -> launch_notifications.",
    ].join("\n");
    const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1b1b1b;line-height:1.5;padding:16px">
<p style="margin:0 0 12px;font-size:16px"><strong>${esc(row.email)}</strong> ${what}</p>
<table style="border-collapse:collapse;font-size:14px">
<tr><td style="padding:4px 12px 4px 0;color:#555">Signed up</td><td style="padding:4px 0">${esc(when)} ET</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#555">Source</td><td style="padding:4px 0">${esc(row.source ?? "launch-notification")}</td></tr>
</table>
<p style="margin:16px 0 0;font-size:12px;color:#555">Full table: Supabase &rarr; Cairn Careers &rarr; launch_notifications.</p>
</body></html>`;
    const ok = await sendEmail(env, {
      to: [env.OWNER_EMAIL],
      subject: isBeta ? `Beta access request: ${row.email}` : `New launch-list signup: ${row.email}`,
      text,
      html,
      reply_to: row.email,
    });
    if (!ok) console.error("owner alert send failed", row.email);
  } catch (error) {
    console.error("owner alert failed", error);
  }
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
  "script-src 'self' 'unsafe-inline' https://plausible.io https://www.googletagmanager.com https://*.google-analytics.com https://*.clarity.ms https://static.cloudflareinsights.com https://in.heycatch.ai https://esm.sh",
  "connect-src 'self' https://plausible.io https://*.google-analytics.com https://*.analytics.google.com https://*.clarity.ms https://cloudflareinsights.com https://in.heycatch.ai",
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
 * /media and /brand keep their names across edits, so they are not immutable,
 * but they change a few times a year at most: 30 days of freshness plus a
 * week of stale-while-revalidate. A day was short enough that most returning
 * visitors downloaded the hero image again. When you replace one of these
 * files and need it seen at once, give it a new file name.
 * HTML keeps must-revalidate: prerendered pages change without changing URL.
 */
function cacheControlFor(pathname: string): string | null {
  if (pathname.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  if (pathname.startsWith("/media/") || pathname.startsWith("/brand/")) {
    return "public, max-age=2592000, stale-while-revalidate=604800";
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

/**
 * LANGUAGE AND CURRENCY BY LOCATION
 * Cloudflare resolves every visitor's country at the edge (CF-IPCountry), so
 * the page can open in the visitor's language with no third-party lookup and
 * no reliance on the browser's language setting. The country → language and
 * country → currency tables live in client/src/lib/geo.ts, shared with the
 * page. Only the resolved country, language and currency are written into
 * the HTML; the visitor's IP is never stored or passed on.
 *
 * The prerendered HTML is English. For a non-English visitor a tiny style
 * hides the page until the client has rendered in their language, so they
 * never see English flash by; the style also removes itself after 2.5 s, so a
 * visitor whose JavaScript fails still gets the English page. Applied only on
 * the production host: the prerender crawl (scripts/prerender.mjs) fetches
 * the same Worker on a preview URL, and must not bake the crawler's country
 * into the static files.
 */
function localizeHtml(response: Response, request: Request, url: URL): Response {
  if (url.hostname !== "cairncareers.com") return response;
  if (!(response.headers.get("Content-Type") || "").includes("text/html")) return response;
  const geo = geoForCountry(request.headers.get("CF-IPCountry"));
  const veil =
    geo.lang === "en"
      ? ""
      : `<style id="cairn-lang-veil">#root{visibility:hidden;animation:cairn-unveil 0s 2.5s forwards}@keyframes cairn-unveil{to{visibility:visible}}</style>`;
  const out = new HTMLRewriter()
    .on("html", { element: (el) => el.setAttribute("lang", geo.lang === "en" ? "en-US" : geo.lang) })
    .on("head", { element: (el) => el.append(`<script id="cairn-geo">window.__cairnGeo=${JSON.stringify(geo)}</script>${veil}`, { html: true }) })
    .transform(response);
  out.headers.append("Vary", "CF-IPCountry");
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

/**
 * HEYCATCH SHORT LINKS
 * Single-character paths (/a-/z, /0-/9) are reserved for HeyCatch channel
 * attribution. Unknown paths here get a real 404 page rather than an SPA
 * catch-all, so without this rule every short link would dead-end. The query
 * IS the attribution; the SDK cleans it off the URL bar after landing. No real
 * route is a single character, so nothing is excluded.
 */
/**
 * UNSUBSCRIBE
 * GET  /api/unsubscribe?e=<email>&t=<token>  -> stamps unsubscribed_at, HTML confirmation.
 * POST /api/unsubscribe?e=<email>&t=<token>  -> same, JSON. RFC 8058 one-click from
 *      Gmail / Apple Mail via the List-Unsubscribe-Post header.
 * The token is checked in constant time. Idempotent: a second click is still ok.
 * Email only: nothing here touches billing.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function suppressEmail(env: Env, rawEmail: string, rawToken: string): Promise<{ ok: boolean; status: number }> {
  const email = (rawEmail ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 320) return { ok: false, status: 400 };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, status: 503 };
  const expected = await unsubToken(env, email);
  if (!safeEqual((rawToken ?? "").trim().toLowerCase(), expected)) return { ok: false, status: 403 };
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/launch_notifications?email=eq.${encodeURIComponent(email)}&unsubscribed_at=is.null`,
    { method: "PATCH", headers: sbHeaders(env, "return=minimal"), body: JSON.stringify({ unsubscribed_at: new Date().toISOString() }) },
  );
  if (!res.ok) {
    console.error("unsubscribe stamp failed", res.status);
    return { ok: false, status: 500 };
  }
  console.log(`unsubscribed ${email}`);
  return { ok: true, status: 200 };
}

function unsubscribePage(title: string, body: string, status: number): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} | CairnCareers</title></head>
<body style="margin:0;padding:0;background:#f0ead7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b0d0c;line-height:1.55">
<div style="padding:48px 12px"><div style="max-width:560px;margin:0 auto;background:#fbf8ed;border-radius:12px;overflow:hidden;border:1px solid #ddd7c5">
<div style="background:#0b0d0c;padding:20px 28px;border-bottom:4px solid #b7ff38"><a href="https://cairncareers.com" style="text-decoration:none"><span style="color:#fff;font-family:Arial Black,Arial,Helvetica,sans-serif;font-size:24px;font-weight:900;letter-spacing:-1px">Cairn</span><span style="color:#fff;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;letter-spacing:3px;margin-left:6px">CAREERS</span></a></div>
<div style="padding:32px 28px"><h1 style="margin:0 0 16px;font-size:22px">${title}</h1>${body}
<p style="margin:24px 0 0"><a href="https://cairncareers.com" style="color:#0b0d0c;font-weight:700">Back to CairnCareers</a></p></div></div></div></body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

const UNSUB_DONE = `<p style="margin:0 0 16px">You will not get any more email from CairnCareers at that address.</p><p style="margin:0">Changed your mind, or clicked by accident? Email <a href="mailto:contact@cairncareers.com" style="color:#0b0d0c">contact@cairncareers.com</a> and we will turn it back on.</p>`;
const UNSUB_BAD = `<p style="margin:0 0 16px">That unsubscribe link is not valid. It may have been cut short by your email client.</p><p style="margin:0">Email <a href="mailto:contact@cairncareers.com" style="color:#0b0d0c">contact@cairncareers.com</a> and we will take you off the list by hand.</p>`;

async function handleUnsubscribe(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const email = url.searchParams.get("e") ?? "";
  const token = url.searchParams.get("t") ?? "";
  const r = await suppressEmail(env, email, token);
  if (request.method === "GET") {
    return r.ok ? unsubscribePage("You are unsubscribed", UNSUB_DONE, 200) : unsubscribePage("Unsubscribe", UNSUB_BAD, r.status);
  }
  return Response.json({ ok: r.ok }, { status: r.status, headers: { "Cache-Control": "no-store" } });
}

function shortLinkRedirect(url: URL): Response | null {
  const match = /^\/([a-z0-9])$/.exec(url.pathname);
  if (!match) return null;
  return Response.redirect(`${url.origin}/?utm_source=heycatch&utm_campaign=${match[1]}`, 302);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const redirect = apexRedirect(url) ?? shortLinkRedirect(url);
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

    if (url.pathname === "/api/unsubscribe" && (request.method === "GET" || request.method === "POST")) {
      return secured(await handleUnsubscribe(request, env));
    }

    if (request.method === "GET" && url.pathname === "/api/beta-count") {
      return handleBetaCount(request, env, ctx);
    }

    // Any other /api/* path (or a non-POST on this one) falls through to assets,
    // which will 404 it via not_found_handling. There's nothing else to serve here.
    return localizeHtml(withHeaders(await env.ASSETS.fetch(request), url.pathname), request, url);
  },

  /**
   * Cron schedules in wrangler.jsonc. The daily count runs on the 13:00 UTC
   * tick; every tick, including that one, also sends any pending account-ready
   * emails.
   */
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sendAccountReadyEmails(env));
  },
} satisfies ExportedHandler<Env>;
