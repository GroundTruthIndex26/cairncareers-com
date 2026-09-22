-- Unsubscribe support for the two automated subscriber emails.
-- Stamped by the Worker's /api/unsubscribe route (signed link in every email).
-- No automated email is sent to a row with this set.
alter table public.launch_notifications
  add column if not exists unsubscribed_at timestamptz;
