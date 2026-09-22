# Beta "your account is ready" email

Status: BUILT and merged, but switched OFF. Decided 2026-09-22.

The beta app does not exist yet, so there is no sign-in link to put in this
email. The template, the cron sender, and the database columns are all in
place; the only missing piece is the app.

## Where it lives

- Template: `accountReadyEmail()` in `worker/index.ts`.
- Sender: `sendAccountReadyEmails()`, run by the `*/15 * * * *` cron in
  `wrangler.jsonc`. It returns immediately while `APP_URL` is empty.
- Columns on `launch_notifications`: `account_ready_at` (set by hand when the
  account exists) and `account_ready_sent_at` (stamped by the Worker so each
  address gets it once). Applied to production 2026-09-22.

## To turn it on, when the app exists

1. Set `APP_URL` in `wrangler.jsonc` to the sign-in page. Merge to `main`.
2. Check the line "Sign in with this email address, the one this note was sent
   to" still matches how sign-in actually works (magic link, password, other).
   Edit the template if not.
3. Test: set `account_ready_at = now()` on a `contact+test@cairncareers.com`
   row with `source = beta-request`. The email arrives within 15 minutes and
   `account_ready_sent_at` is stamped.
4. For each real beta account you create, set `account_ready_at` on that row
   (Supabase table editor, or SQL). Unsubscribed rows are skipped.

## The email, as stored in the code

Subject: Your CairnCareers beta account is ready

Your CairnCareers beta account is ready.

You asked for beta access, and your account is open. Sign in with this email address, the one this note was sent to.

Sign in: <APP_URL>

What you get as a beta user:
  - CairnCareers is free for you until October 31, 2027, one year after the public launch. No card, no trial clock, nothing to cancel.
  - Compare the career paths you are weighing on salary, job growth, and how exposed each is to AI, then leave with a next move you can explain.
  - You are using it before anyone else. If something is confusing, slow, or wrong, reply and tell us. Beta feedback shapes what we fix first.

Have a question, or want to tell us which career paths you are weighing? Reply to this email. A person reads every message.

Brooke Houck
CairnCareers, a Phronesis Labs LLC product
https://cairncareers.com

You are receiving this because you entered your email at cairncareers.com.
Unsubscribe any time: <signed unsubscribe link>

Phronesis Labs LLC, 1710 East Franklin Street #1045, Chapel Hill, NC 27514, United States

The HTML version uses the same frame as the launch-list and beta
acknowledgment emails (ink header, cairn mark, lime sign-in button, Unsubscribe
button, mailing address) and carries List-Unsubscribe headers.
