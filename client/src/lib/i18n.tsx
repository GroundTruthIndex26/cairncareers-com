/**
 * Language and currency for the page.
 *
 * Resolution order for the language: the visitor's own choice from the header
 * switch (kept in localStorage), then a ?lang= query (handy for sharing a
 * Spanish or French link), then the country Cloudflare resolved at the edge
 * (window.__cairnGeo, written by worker/index.ts), then English. Currency
 * follows the country only; there is no manual currency switch.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Currency, type Geo, type Lang, LANGS, RATES, isLang } from "./geo";
import { en } from "./translations/en";

export type Strings = typeof en;

// English ships in the main bundle: it is the prerendered language and the
// fallback. Spanish and French are a chunk each, fetched only by a visitor
// who reads that language, so everyone else stops paying for both.
const STRINGS: Partial<Record<Lang, Strings>> = { en };
const LOADERS: Record<Exclude<Lang, "en">, () => Promise<Strings>> = {
  es: () => import("./translations/es").then((m) => m.es),
  fr: () => import("./translations/fr").then((m) => m.fr),
};

/** Fetches a language's strings if they are not in memory yet. Never rejects: on failure the page stays in English. */
export function loadStrings(lang: Lang): Promise<void> {
  if (lang === "en" || STRINGS[lang]) return Promise.resolve();
  return LOADERS[lang]().then((strings) => { STRINGS[lang] = strings; }).catch(() => {});
}
const STORAGE_KEY = "cairn-lang";

declare global {
  interface Window {
    __cairnGeo?: Geo;
  }
}

function readGeo(): Geo | undefined {
  return typeof window === "undefined" ? undefined : window.__cairnGeo;
}

export function initialLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* storage blocked: fall through */
  }
  // A ?lang= link counts as a choice: remember it, so leaving for a page
  // without the query (the sample dashboard) and coming back keeps it.
  const fromQuery = new URLSearchParams(window.location.search).get("lang");
  if (isLang(fromQuery)) {
    try {
      localStorage.setItem(STORAGE_KEY, fromQuery);
    } catch {
      /* storage blocked */
    }
    return fromQuery;
  }
  const geo = readGeo();
  return geo && isLang(geo.lang) ? geo.lang : "en";
}

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Strings;
  currency: Currency;
  /** "US$6", or "≈CA$8" for a visitor whose country uses another currency. */
  price: (usd: number) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  // ?currency=CAD previews what a visitor from that currency's country sees;
  // the real value comes from the country Cloudflare resolved.
  const currency = useMemo<Currency>(() => {
    const override = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("currency");
    if (override && override.toUpperCase() in RATES) return override.toUpperCase() as Currency;
    return readGeo()?.currency ?? "USD";
  }, []);

  const setLang = useCallback((next: Lang) => {
    // Switch only once the strings are here, so the page never renders a
    // language it does not have.
    loadStrings(next).then(() => setLangState(next));
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage blocked: the choice lasts for this page view */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = LANGS[lang].locale;
    // The Worker hides the prerendered English page for non-English visitors
    // until the page has rendered in their language. Lift that now.
    document.getElementById("cairn-lang-veil")?.remove();
  }, [lang]);

  const price = useCallback(
    (usd: number) => {
      if (currency === "USD") return `US$${usd}`;
      const local = Math.round(usd * RATES[currency]);
      const formatted = new Intl.NumberFormat(LANGS[lang].locale, {
        style: "currency",
        currency,
        currencyDisplay: "symbol",
        maximumFractionDigits: 0,
      }).format(local);
      return `≈${formatted}`;
    },
    [currency, lang],
  );

  const value = useMemo<I18n>(() => ({ lang, setLang, t: STRINGS[lang] ?? en, currency, price }), [lang, setLang, currency, price]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/**
 * Translated copy is stored as plain strings with a little markup, so each
 * language is data rather than three copies of the JSX: [text](href) for a
 * link, **text** for strong, *text* for emphasis. External links open in a
 * new tab.
 *
 * A * with a letter or digit on both sides (the one in "O*NET") is a literal
 * character, never emphasis. Without that rule the renderer paired the * in
 * "O*NET" with the next one in the paragraph, italicised everything between
 * them, and swallowed any link in the way.
 */
// Letters and digits, including the accented Latin letters es and fr use.
const INTRAWORD_STAR = /([0-9A-Za-z\u00C0-\u024F])\*(?=[0-9A-Za-z\u00C0-\u024F])/g;
const STAR_STANDIN = "\uE000";
const protectStars = (text: string) => text.replace(INTRAWORD_STAR, `$1${STAR_STANDIN}`);
const restoreStars = (text: string) => text.replaceAll(STAR_STANDIN, "*");

export function rich(source: string): ReactNode[] {
  const text = protectStars(source);
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) out.push(restoreStars(text.slice(last, match.index)));
    if (match[1] !== undefined) {
      const href = restoreStars(match[2]);
      const external = /^https?:/.test(href);
      out.push(
        <a key={key++} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
          {restoreStars(match[1])}
        </a>,
      );
    } else if (match[3] !== undefined) {
      out.push(<strong key={key++}>{restoreStars(match[3])}</strong>);
    } else if (match[4] !== undefined) {
      out.push(<em key={key++}>{restoreStars(match[4])}</em>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(restoreStars(text.slice(last)));
  return out;
}

/** The same string with the markup removed, for JSON-LD and meta tags. */
export function plain(text: string): string {
  const stripped = protectStars(text).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
  return restoreStars(stripped);
}
