# CairnCareers (cairncareers-com)

Read this first in every Claude Code session.

This repo is the ONLY live source for cairncareers.com. The older repo GroundTruthIndex26/college-entry-aijrc is deprecated; nothing committed there reaches the site. Its Supabase project (college-entry-aijrc, ref mrhmpooawrwbnfgcqfld) was deleted.

## Where things are

- `README.md`: stack, build commands, prerender setup.
- `worker/index.ts`: the only server-side code. Handles `/api/launch-notifications` and `/api/contact`, writes to Supabase, sends Resend email. Also serves `GET /api/beta-count` (count of beta requests only, null below 10, cached 10 minutes), `/api/unsubscribe` (signed link in every subscriber email; stamps `unsubscribed_at`), a daily cron that emails signup counts to OWNER_EMAIL, and a 15-minute cron that sends the "your account is ready" email to any beta row with `account_ready_at` set and `account_ready_sent_at` null. Beta accounts are provisioned by hand: once one exists, set `account_ready_at` on the row and the email follows within 15 minutes. The sign-in link comes from the `APP_URL` var in `wrangler.jsonc`; while that is empty the email never sends, because the beta app is not built yet. Turn-on steps: `docs/ideas/beta-account-ready-email.md`. Subscriber emails carry the company mailing address from the `POSTAL_ADDRESS` var in `wrangler.jsonc`.
- `client/src/pages/`: Home, legal pages, Contact, Roadmap, and `Compare.tsx` (the four `/vs/*` pages; every competitor claim there carries a dated source note, so re-check the sources before editing a price).
- `client/public/dashboard-preview/`: the ten-page sample Premium dashboard (noindex, illustrative data).
- `client/public/brand/`: brand assets.
- `docs/ideas/`: feature ideas that are NOT built yet. Each file says whether a decision has been made. Do not build anything in there without Brooke confirming the open decisions first.

## Supabase

- Project: "Cairn Careers", ref `kxeqihuvmiurtksftfuj`, us-east-1, Phronesis Labs org.
- Tables (public schema, RLS on): `launch_notifications` (email, source = launch-notification or beta-request, welcomed_at, unsubscribed_at, account_ready_at, account_ready_sent_at), `contact_messages`. Migrations live in `supabase/migrations/`.
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
- `main` auto-deploys to cairncareers.com via the GitHub Actions workflow `.github/workflows/deploy.yml` (build, prerender, `wrangler deploy`, then a production smoke test). Cloudflare Workers Builds is NOT the deploy path: its check fails on every commit because the repo connection was never completed, so a red "Workers Builds" check on a PR does not block a merge. The check that matters is `deploy` on `main`.
- Never delete `client/public/googlee25309b4cf7bf9f6.html` (Search Console) or `client/public/BingSiteAuth.xml` (Bing).
