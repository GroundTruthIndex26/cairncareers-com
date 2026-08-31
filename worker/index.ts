/**
 * Server-side logic: redirecting www to the apex domain, and saving the two
 * kinds of message the site collects — launch-notification signups and contact
 * form submissions — to Supabase. Everything else is served as static assets
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

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ASSETS: Fetcher;
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
 * Both cairncareers.com and www.cairncareers.com are custom domains on this
 * Worker, so without this the whole site answers 200 on both hostnames — a
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

    if (url.pathname === "/api/launch-notifications" && request.method === "POST") {
      return handleLaunchNotifications(request, env);
    }

    if (url.pathname === "/api/contact" && request.method === "POST") {
      return handleContact(request, env);
    }

    // Any other /api/* path (or a non-POST on this one) falls through to assets,
    // which will 404 it via not_found_handling — there's nothing else to serve here.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
