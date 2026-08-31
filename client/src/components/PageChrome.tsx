import { ArrowRight, ArrowUp, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import Breadcrumbs, { type Crumb } from "@/components/Breadcrumbs";

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

const PRIMARY_NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#dashboard-preview", label: "Sample Dashboard" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#about", label: "About" },
];

export function PageHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="/#top" className="wordmark" aria-label="CairnCareers home">
          <CairnMark />
          <span><strong>Cairn</strong><small>Careers</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Primary navigation">
          {PRIMARY_NAV.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}
        </nav>
        <div className="header-controls">
          <a className="header-cta" href="/#premium-checkout">Show me my career paths <ArrowRight /></a>
          <button className="menu-button" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav className="mobile-nav container" aria-label="Mobile navigation">
          {PRIMARY_NAV.map((item) => (
            <a key={item.href} onClick={() => setMobileOpen(false)} href={item.href}>{item.label}</a>
          ))}
        </nav>
      )}
    </header>
  );
}

export function PageFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-block">
          <div className="wordmark footer-mark"><CairnMark /><span><strong>Cairn</strong><small>Careers</small></span></div>
          <p>Career context for college students and recent graduates.</p>
          <p className="footer-product-line">
            Cairn Careers is a product of <a href="https://phronesislabs.net" target="_blank" rel="noreferrer">Phronesis Labs, LLC</a>.
          </p>
        </div>
        <div className="footer-links">
          <a href="mailto:contact@cairncareers.com">contact@cairncareers.com</a>
          <span>
            <a href="/methodology">Methodology</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/refunds">Refunds</a> · <a href="/contact">Contact</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button className="site-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">
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
