// Site-wide constants. Change the committed support address here and nowhere else.
export const CONTACT_EMAIL = "contact@cairncareers.com";

// Public Supabase Edge Function endpoint (safe for the browser) — the same
// contact-form backend already live in production, so both codebases deliver
// to the same inbox instead of standing up a second endpoint.
const SUPABASE_FUNCTIONS = "https://mrhmpooawrwbnfgcqfld.supabase.co/functions/v1";
export const endpoints = {
  contact: (import.meta.env.VITE_SUPABASE_CONTACT_ENDPOINT as string | undefined) || `${SUPABASE_FUNCTIONS}/contact-cairn`,
};
