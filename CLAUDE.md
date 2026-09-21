# CairnCareers (cairncareers-com)

Read this first in every Claude Code session.

This repo is the ONLY live source for cairncareers.com. The older repo GroundTruthIndex26/college-entry-aijrc is deprecated; nothing committed there reaches the site. Its Supabase project (college-entry-aijrc, ref mrhmpooawrwbnfgcqfld) was deleted.

## Where things are

- `README.md`: stack, build commands, prerender setup.
- `worker/index.ts`: the only server-side code. Handles `/api/launch-notifications` and `/api/contact`, writes to Supabase, sends Resend email. Also serves `GET /api/beta-count` (count of beta requests only, null below 10, cached 10 minutes).
- `client/src/pages/`: Home, legal pages, Contact, Roadmap, and `Compare.tsx` (the four `/vs/*` pages; every competitor claim there carries a dated source note, so re-check the sources before editing a price).
- `client/public/dashboard-preview/`: the ten-page sample Premium dashboard (noindex, illustrative data).
- `client/public/brand/`: brand assets.
- `docs/ideas/`: feature ideas that are NOT built yet. Each file says whether a decision has been made. Do not build anything in there without Brooke confirming the open decisions first.

## Supabase

- Project: "Cairn Careers", ref `kxeqihuvmiurtksftfuj`, us-east-1, Phronesis Labs org.
- Tables (public schema, RLS on): `launch_notifications` (email, source = launch-notification or beta-request, welcomed_at), `contact_messages`.
- No Edge Functions. The browser never talks to Supabase; the Worker writes with the service-role key (Worker secrets SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
- No preorders, waitlist, or chat tables exist in this project. Anything that refers to a `preorders` table, `waitlist_signups`, `watch_state`, or a `cairn-guide` Edge Function is from the deleted project.
- Read-only engine sources in other projects (never write): GroundTruth_V4_Canonical `hbtgjcxtdcvlngdfhflb` (bls_reference).

## Open ideas

- `docs/ideas/fluid-shaped-readiness-feature.md`: add an "I don't know, but I can find out fast with AI" signal to the dashboard. Placement undecided (fourth headline score vs sub-score inside readiness).

## Hard rules

- No em dashes anywhere, in site copy or code comments.
- The words "semester" and "$32" are banned from the site; use "term".
- Every number shown to a user carries a numbered footnote with a source link.
- Anthropic is the only AI vendor. No OpenAI.
- `main` auto-deploys to cairncareers.com via Cloudflare Workers Builds.
- Never delete `client/public/googlee25309b4cf7bf9f6.html` (Search Console) or `client/public/BingSiteAuth.xml` (Bing).
