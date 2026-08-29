/**
 * The only server-side logic this site needs: saving a launch-notification
 * email to Supabase. Everything else is served as static assets — see
 * wrangler.jsonc's run_worker_first, which routes only /api/* here.
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ASSETS: Fetcher;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/launch-notifications" && request.method === "POST") {
      return handleLaunchNotifications(request, env);
    }

    // Any other /api/* path (or a non-POST on this one) falls through to assets,
    // which will 404 it via not_found_handling — there's nothing else to serve here.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
