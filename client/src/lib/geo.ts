/**
 * Country → language and country → currency, in one place.
 *
 * Shared by the Worker (which reads the visitor's country from Cloudflare's
 * CF-IPCountry on every request and writes the result into the HTML) and by
 * the page (which uses the same tables for the manual language switch and
 * for showing prices). Keep this file free of DOM and React so the Worker
 * can import it.
 *
 * Language follows where the visitor is, not their browser setting, and the
 * header switch lets them override it. Anything not listed is English.
 * Canada is English with French one click away.
 */
export type Lang = "en" | "es" | "fr";

export const LANGS: Record<Lang, { label: string; short: string; locale: string }> = {
  en: { label: "English", short: "EN", locale: "en-US" },
  es: { label: "Español", short: "ES", locale: "es" },
  fr: { label: "Français", short: "FR", locale: "fr" },
};

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "es" || value === "fr";
}

const SPANISH = ["ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "BO", "DO", "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR"];
const FRENCH = ["FR", "BE", "CH", "MC", "LU"];

export function langForCountry(country: string | null | undefined): Lang {
  const c = (country || "").toUpperCase();
  if (SPANISH.includes(c)) return "es";
  if (FRENCH.includes(c)) return "fr";
  return "en";
}

/**
 * Prices are charged in US dollars (Stripe). Visitors from these countries
 * see an approximate figure in their own currency beside the USD amount.
 * Rates are rounded and reviewed by hand; the date is the last review.
 */
export type Currency = "USD" | "CAD" | "GBP" | "EUR" | "MXN" | "AUD" | "CHF";

export const RATES: Record<Currency, number> = {
  USD: 1,
  CAD: 1.37, // reviewed 2026-09-18
  GBP: 0.76,
  EUR: 0.86,
  MXN: 18.5,
  AUD: 1.52,
  CHF: 0.8,
};

const EURO = ["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MC", "MT", "NL", "PT", "SI", "SK"];

export function currencyForCountry(country: string | null | undefined): Currency {
  const c = (country || "").toUpperCase();
  if (c === "CA") return "CAD";
  if (c === "GB") return "GBP";
  if (c === "MX") return "MXN";
  if (c === "AU") return "AUD";
  if (c === "CH") return "CHF";
  if (EURO.includes(c)) return "EUR";
  return "USD";
}

/** What the Worker writes into the page as window.__cairnGeo. */
export interface Geo {
  country: string;
  lang: Lang;
  currency: Currency;
}

export function geoForCountry(country: string | null | undefined): Geo {
  const c = (country || "").toUpperCase();
  return { country: c, lang: langForCountry(c), currency: currencyForCountry(c) };
}
