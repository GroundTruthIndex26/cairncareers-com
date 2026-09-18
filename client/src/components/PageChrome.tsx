import { ArrowRight, ArrowUp, ChevronDown, Globe2, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import Breadcrumbs, { type Crumb } from "@/components/Breadcrumbs";
import { LANGS, type Lang } from "@/lib/geo";
import { rich, useI18n } from "@/lib/i18n";

const BASE_URL = import.meta.env.BASE_URL;
const BRAND_ICON = `${BASE_URL}brand/cairn-icon.svg`;

/**
 * Shared site header, footer, and back-to-top control: the chrome every
 * page carries, extracted from the landing page so secondary pages (legal,
 * contact, roadmap) get the same identity instead of a second design.
 */
export function CairnMark() {
  return <img className="cairn-mark" src={BRAND_ICON} alt="" aria-hidden="true" />;
}

/**
 * The language switch in the header. The Worker picks a language from the
 * visitor's country; this is the visitor's override, remembered in the
 * browser (see lib/i18n.tsx). Shows the language codes, so it reads the same
 * whichever language the page is currently in.
 */
export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="compact-select">
      <Globe2 aria-hidden="true" />
      <span className="sr-only">{t.languageSwitch}</span>
      <span className="compact-select-value" aria-hidden="true">{LANGS[lang].short}</span>
      <select value={lang} onChange={(event) => setLang(event.target.value as Lang)}>
        {(Object.keys(LANGS) as Lang[]).map((key) => (
          <option key={key} value={key} lang={LANGS[key].locale}>{LANGS[key].short}</option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" />
    </label>
  );
}

export function PageHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();
  const nav = [
    { href: "/#how-it-works", label: t.nav.how },
    { href: "/#dashboard-preview", label: t.nav.dashboard },
    { href: "/roadmap", label: t.nav.roadmap },
    { href: "/#pricing", label: t.nav.pricing },
    { href: "/#about", label: t.nav.about },
  ];

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="/#top" className="wordmark" aria-label={t.nav.home}>
          <CairnMark />
          <span><strong>Cairn</strong><small>Careers</small></span>
        </a>
        <nav className="desktop-nav" aria-label={t.nav.primary}>
          {nav.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
        </nav>
        <div className="header-controls">
          <a className="header-cta" href="/#beta-access">{t.nav.cta} <ArrowRight /></a>
          <LanguageSwitch />
          <button className="menu-button" onClick={() => setMobileOpen((value) => !value)} aria-label={t.nav.toggle}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="mobile-nav container" aria-label={t.nav.mobile}>
          {nav.map((item) => (
            <a key={item.href} onClick={() => setMobileOpen(false)} href={item.href}>{item.label}</a>
          ))}
        </nav>
      )}
    </header>
  );
}

export function PageFooter() {
  const { t } = useI18n();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <div className="wordmark footer-mark"><CairnMark /><span><strong>Cairn</strong><small>Careers</small></span></div>
          <p>{t.footer.tagline}</p>
          <p className="footer-product-line">{rich(t.footer.productLine)}</p>
        </div>
        <div className="footer-links">
          <a href="mailto:contact@cairncareers.com">contact@cairncareers.com</a>
          <span>
            <a href="/methodology">{t.footer.methodology}</a> · <a href="/privacy">{t.footer.privacy}</a> · <a href="/terms">{t.footer.terms}</a> · <a href="/refunds">{t.footer.refunds}</a> · <a href="/contact">{t.footer.contact}</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button className="site-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label={t.legal.backToTop}>
      <ArrowUp />
    </button>
  );
}

/** Lighter page header for secondary pages. Reuses the site's editorial
 * vocabulary (.section-label chip, Archivo Black display type) rather than
 * the landing page's full dark hero, which is homepage-specific. */
export function PageHero({ eyebrow, title, breadcrumb, children }: { eyebrow: string; title: string; breadcrumb?: Crumb[]; children?: ReactNode }) {
  return (
    <section className="page-hero">
      <div className="container">
        {breadcrumb && <Breadcrumbs items={breadcrumb} />}
        <span className="section-label"><span>{eyebrow}</span></span>
        <h1>{title}</h1>
        {children}
      </div>
    </section>
  );
}
