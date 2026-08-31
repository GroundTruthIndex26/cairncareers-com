/**
 * Server-side logic: redirecting www to the apex domain, and saving the two
 * kinds of message the site collects (launch-notification signups and contact
 * form submissions) to Supabase. Everything else is served as static assets
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

async function handleLaunchNotifications(request: Request, env: Env): Promise<Response> {
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
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/launch_notifications?on_conflict=email`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ email, source: "launch-notification" }),
    });

    if (!response.ok) {
      console.error("Supabase launch-notification insert failed", response.status);
      return Response.json({ error: "We could not save your notification request. Please try again." }, { status: 502 });
    }

    return Response.json({ saved: true }, { status: 201 });
  } catch (error) {
    console.error("Supabase launch-notification request failed", error);
    return Response.json({ error: "We could not save your notification request. Please try again." }, { status: 502 });
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
  async fetch(request, env) {
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
      const handler =
        url.pathname === "/api/contact" ? handleContact : handleLaunchNotifications;
      return secured(await handler(request, env));
    }

    // Any other /api/* path (or a non-POST on this one) falls through to assets,
    // which will 404 it via not_found_handling. There's nothing else to serve here.
    return withHeaders(await env.ASSETS.fetch(request), url.pathname);
  },
} satisfies ExportedHandler<Env>;
