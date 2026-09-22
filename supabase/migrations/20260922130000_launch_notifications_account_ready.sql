-- "Your account is ready" email for beta users. Provisioning is manual:
-- set account_ready_at once the account exists; the Worker cron sends the
-- email and stamps account_ready_sent_at so it goes out once.
alter table public.launch_notifications
  add column if not exists account_ready_at timestamptz,
  add column if not exists account_ready_sent_at timestamptz;
