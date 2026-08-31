// Site-wide constants. Change the committed support address here and nowhere else.
export const CONTACT_EMAIL = "contact@cairncareers.com";

// The contact form posts to this Worker route, which writes to Supabase with a
// server-side key. See worker/index.ts. It previously called a Supabase Edge
// Function directly; that project was deleted and every submission had been
// failing with a 410, so the browser no longer talks to Supabase at all.
export const endpoints = {
  contact: (import.meta.env.VITE_SUPABASE_CONTACT_ENDPOINT as string | undefined) || "/api/contact",
};
