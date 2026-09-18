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
import { es } from "./translations/es";
import { fr } from "./translations/fr";

export type Strings = typeof en;

const STRINGS: Record<Lang, Strings> = { en, es, fr };
const STORAGE_KEY = "cairn-lang";

declare global {
  interface Window {
    __cairnGeo?: Geo;
  }
}

function readGeo(): Geo | undefined {
  return typeof window === "undefined" ? undefined : window.__cairnGeo;
}

function initialLang(): Lang {
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
  const currency = readGeo()?.currency ?? "USD";

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
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

  const value = useMemo<I18n>(() => ({ lang, setLang, t: STRINGS[lang], currency, price }), [lang, setLang, currency, price]);
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
 */
export function rich(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    if (match[1] !== undefined) {
      const href = match[2];
      const external = /^https?:/.test(href);
      out.push(
        <a key={key++} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
          {match[1]}
        </a>,
      );
    } else if (match[3] !== undefined) {
      out.push(<strong key={key++}>{match[3]}</strong>);
    } else if (match[4] !== undefined) {
      out.push(<em key={key++}>{match[4]}</em>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** The same string with the markup removed, for JSON-LD and meta tags. */
export function plain(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1");
}
