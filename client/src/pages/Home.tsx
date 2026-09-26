/**
 * CairnCareers revision style note: Y2K editorial utility, asymmetric field-note
 * modules, one solid-lime CTA, candid proof placeholders, and fast mobile behavior.
 */
import {
  ArrowRight,
  ArrowUp,
  BarChart3,
  CalendarDays,
  Check,
  CirclePlay,
  ExternalLink,
  LayoutDashboard,
  LockKeyhole,
  Mail,
  Map,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { LanguageSwitch } from "@/components/PageChrome";
import { usePageMeta } from "@/hooks/usePageMeta";
import { plain, rich, useI18n } from "@/lib/i18n";
import { pageJsonLd } from "@/lib/pageJsonLd";
import { trackConversion } from "@/lib/analytics";

const BASE_URL = import.meta.env.BASE_URL;
const ASSETS = {
  hero: `${BASE_URL}media/cairn-route-map-hero.webp`,
  hero640: `${BASE_URL}media/cairn-route-map-hero-640.webp`,
  hero960: `${BASE_URL}media/cairn-route-map-hero-960.webp`,
  hero1280: `${BASE_URL}media/cairn-route-map-hero-1280.webp`,
  founder: `${BASE_URL}media/cairn-founder.webp`,
};

const BRAND_ASSETS = {
  icon: `${BASE_URL}brand/cairn-icon.svg`,
  lightLogo: `${BASE_URL}brand/cairn-logo-light.svg`,
  darkLogo: `${BASE_URL}brand/cairn-logo-dark.svg`,
};

const leadCaptureEndpoint = import.meta.env.VITE_LEAD_CAPTURE_ENDPOINT || "/api/launch-notifications";

/**
 * Both signup forms carry a hidden `website` field, like the contact form. No
 * person sees or fills it; a form-filling bot usually does. The Worker answers
 * a filled one with the normal success response and saves nothing, so the bot
 * cannot tell. It is uncontrolled and read at submit time.
 */
function honeypot(form: HTMLFormElement): string {
  const value = new FormData(form).get("website");
  return typeof value === "string" ? value.trim() : "";
}

type CampaignKey = "default" | "campus" | "social";
type BillingCycle = "monthly" | "annual";

/** List prices in US dollars. The page shows them in the visitor's currency
 * (see price() in lib/i18n.tsx); Stripe charges USD. */
const proPricing: Record<BillingCycle, { usd: number; savings?: boolean }> = {
  monthly: { usd: 6 },
  annual: { usd: 46, savings: true },
};

const premiumPricing: Record<BillingCycle, { regular: number; prelaunch: number; savings?: boolean }> = {
  monthly: { regular: 11, prelaunch: 8 },
  annual: { regular: 86, prelaunch: 61, savings: true },
};

/**
 * The discounted pricing cards, saved on September 18, 2026 to bring back on
 * November 1: Premium at US$8/month or US$61/year with the regular price struck
 * through, "Limited Time prelaunch price" labels, and both billing toggles
 * starting on annual. Set this to true to restore them. That also drops the
 * "Beta users get a free year after launch!" running line, since beta signups
 * close at launch.
 */
const SHOW_DISCOUNTED_PRICING = false;
const DEFAULT_BILLING: BillingCycle = SHOW_DISCOUNTED_PRICING ? "annual" : "monthly";

/**
 * Nothing is sold before launch. While this is false the Premium card shows a
 * disabled "Checkout opens at launch" button in place of the Stripe link, and
 * no payment URL is shipped in the page. Set it to true to turn checkout back
 * on; check premiumPaymentLinks still point at the right Stripe products first.
 */
const CHECKOUT_OPEN = false;

// Add the two Stripe Payment Link URLs in the preview/deployment environment.
// The CTAs become live checkout links as soon as these values are supplied.
const premiumPaymentLinks: Record<BillingCycle, string> = {
  monthly: import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PAYMENT_LINK || "https://buy.stripe.com/fZu6oHbNN64n0vYaaB2VG0f",
  annual: import.meta.env.VITE_STRIPE_PREMIUM_ANNUAL_PAYMENT_LINK || "https://buy.stripe.com/dRm14n6ttfEX2E60A12VG0e",
};

/**
 * The permissioned-proof queue is written and ready, but every slot in it is
 * still empty. Rendering it shipped roughly 1.5 KB of "reserved story 1",
 * "publish with cohort, date range, and source" and the review-site checklist
 * into the HTML of every visitor and crawler. `hidden` stops it being seen, not
 * being read. Flip this to true once there is a verified story to publish.
 */
const SHOW_PROOF_QUEUE = false;

/** The nine sample-dashboard pages; their names and blurbs live in lib/translations. */
const dashboardAreas = [
  { number: "01", href: `${BASE_URL}dashboard-preview/evidence`, accent: "lime" },
  { number: "02", href: `${BASE_URL}dashboard-preview/portfolio`, accent: "cyan" },
  { number: "03", href: `${BASE_URL}dashboard-preview/resume`, accent: "pink" },
  { number: "04", href: `${BASE_URL}dashboard-preview/linkedin`, accent: "amber" },
  { number: "05", href: `${BASE_URL}dashboard-preview/network`, accent: "cyan" },
  { number: "06", href: `${BASE_URL}dashboard-preview/interview`, accent: "lime" },
  { number: "07", href: `${BASE_URL}dashboard-preview/careers`, accent: "amber" },
  { number: "08", href: "/roadmap", accent: "pink" },
  { number: "09", href: `${BASE_URL}dashboard-preview/cleanup`, accent: "lime" },
];

/**
 * FAQ content, single-sourced.
 *
 * The visible markup and the FAQPage JSON-LD are both generated from the same
 * list in lib/translations, so the structured data can never drift from what
 * a reader actually sees, which is the requirement structured data has to meet.
 *
 * WHY THESE ANSWERS ARE SHAPED THIS WAY
 * Every answer states its conclusion in the first sentence and stands on its
 * own without the question or the neighbouring answers. That is what an
 * answer engine can lift cleanly. Ten pages linked to /#faq for a section
 * that did not exist, so this also fixes a dead anchor sitewide.
 */
function faqJsonLd(items: { q: string; a: string }[]) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: plain(item.a) },
    })),
  });
}

/**
 * Quotes from real beta testers, shown between About and the FAQ. Empty until
 * there are real ones: the section renders nothing while this list is empty,
 * so no placeholder ships. Add a quote only with the person's written
 * permission. Each one should name a specific thing the person learned from
 * their score or roadmap, in their own words and their own language.
 * `who` is a first name plus year and field, for example "Senior, Computer Science".
 */
const BETA_QUOTES: { quote: string; name: string; who: string }[] = [];

/**
 * Third-party mentions, shown in a slim strip under the trust strip. Empty until
 * there is a real one: the strip renders nothing while this list is empty, so
 * no "Featured in" heading ships over a blank row. `href` points at the mention
 * itself (the launch page, article, or review profile), never a homepage.
 * `logo` is optional, a path under client/public such as "brand/press/ph.svg".
 */
const FEATURED_IN: { name: string; href: string; logo?: string }[] = [];

/**
 * The 60-second why-I-built-this video under the founder quote. Null until it
 * is recorded, and the founder card is unchanged while it is null. Paths are
 * under client/public, for example "media/founder-why.mp4". Captions are
 * required: the video is the only place those words appear. Self-hosted on
 * purpose: the CSP in worker/index.ts has no frame-src, so a Loom or YouTube
 * iframe would be blocked.
 */
const FOUNDER_VIDEO: { src: string; poster: string; captions: string } | null = null;

function SectionLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <div className="section-label">
      <span>{number}</span>
      <span>{children}</span>
    </div>
  );
}

function CairnMark() {
  return (
    <img className="cairn-mark" src={BRAND_ASSETS.icon} alt="" aria-hidden="true" />
  );
}

/**
 * A running line for the pricing section. Screen readers and crawlers get the
 * sentence once; the scrolling copies are drawn by CSS from --ticker-text, so
 * the prerendered HTML does not repeat it eight times.
 */
function BetaTicker({ text }: { text: string }) {
  const group = <div className="beta-ticker-group"><span /><span /><span /><span /></div>;
  return (
    <div className="beta-ticker" style={{ "--ticker-text": `"${text}"` } as React.CSSProperties}>
      <p className="sr-only">{text}</p>
      <div className="beta-ticker-track" aria-hidden="true">{group}{group}</div>
    </div>
  );
}

/**
 * Covers for the hero map that lift one at a time, so cairn 1, 2 and 3 appear
 * in order (timing lives with .hero-route-veil in index.css). The viewBox is
 * the image's own 1600x900 pixel grid and "slice" matches its object-fit:
 * cover, so each cover stays on its cairn at every crop. Covers 2 and 3 are
 * turned to run across the route, with their soft edges in the gaps between
 * cairns. Without the animation they sit at opacity 0.
 */
function RouteVeil() {
  return (
    <svg className="hero-route-veil" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="route-veil-edge-2" gradientUnits="userSpaceOnUse" x1="730" x2="850" y1="0" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" />
        </linearGradient>
        <linearGradient id="route-veil-edge-3" gradientUnits="userSpaceOnUse" x1="1135" x2="1225" y1="0" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" />
        </linearGradient>
      </defs>
      <rect className="route-veil-1" width="1600" height="900" fill="currentColor" opacity="0" />
      <g transform="rotate(-33.3 800 450)">
        <rect className="route-veil-2" x="730" y="-1000" width="3000" height="3000" fill="url(#route-veil-edge-2)" opacity="0" />
        <rect className="route-veil-3" x="1135" y="-1000" width="3000" height="3000" fill="url(#route-veil-edge-3)" opacity="0" />
      </g>
    </svg>
  );
}

function ProofPhotoSlot({ index }: { index: number }) {
  return (
    <article className="story-slot">
      <div className="photo-slot" aria-label={`Reserved real student photo slot ${index}`}>
        <UserRound aria-hidden="true" />
        <span>Permissioned real photo</span>
      </div>
      <div className="story-slot-body">
        <div className="slot-badge">Reserved story {index}</div>
        <h3>Student name + program</h3>
        <p>Specific before-and-after result, written only after verification and consent.</p>
        <div className="slot-requirements">
          <span><Check /> Full name</span>
          <span><Check /> Measurable result</span>
          <span><Check /> Consent date</span>
        </div>
      </div>
    </article>
  );
}

function MetricSlot({ label }: { label: string }) {
  return (
    <div className="metric-slot">
      <span className="metric-value">&nbsp;</span>
      <strong>{label}</strong>
      <small>Publish with cohort, date range, and source</small>
    </div>
  );
}

export default function Home() {
  const { t, currency, price } = useI18n();
  const [campaign, setCampaign] = useState<CampaignKey>("default");
  const [proBilling, setProBilling] = useState<BillingCycle>(DEFAULT_BILLING);
  const [premiumBilling, setPremiumBilling] = useState<BillingCycle>(DEFAULT_BILLING);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showTopButton, setShowTopButton] = useState(false);
  const [email, setEmail] = useState("");
  const [isLeadSubmitting, setIsLeadSubmitting] = useState(false);
  const [betaEmail, setBetaEmail] = useState("");
  const [betaStatus, setBetaStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [betaError, setBetaError] = useState("");
  const [betaCount, setBetaCount] = useState<number | null>(null);
  const message = t.hero.campaigns[campaign];
  usePageMeta({ title: t.meta.homeTitle, description: t.meta.homeDescription });

  useEffect(() => {
    // The Worker answers null until the count is worth showing (see
    // handleBetaCount in worker/index.ts), and no counter beats a broken one.
    // The beta form sits far below the fold, so the request waits until the
    // visitor scrolls near it. Fired on mount, it sat in the critical request
    // chain of a page whose first job is to paint a headline.
    const section = document.getElementById("beta-access");
    if (!section || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      fetch("/api/beta-count")
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { count?: number | null } | null) => {
          if (typeof data?.count === "number") setBetaCount(data.count);
        })
        .catch(() => {});
    }, { rootMargin: "800px 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = (params.get("utm_source") || params.get("source") || "").toLowerCase();
    if (source.includes("campus")) setCampaign("campus");
    if (source.includes("social") || params.get("utm_medium")?.toLowerCase() === "social") setCampaign("social");
  }, []);

  useEffect(() => {
    /* Only a non-default choice is written into the URL. Rewriting every visit
       to /?locale=en-US replaced the bare URL in the browser's history before
       its title had landed, so browsers kept whatever title this domain served
       before CairnCareers existed as the title for https://cairncareers.com/.
       It also put a query string on every link people copied. */
    const params = new URLSearchParams(window.location.search);
    params.delete("locale");
    if (campaign === "default") params.delete("source");
    else params.set("source", campaign);
    const query = params.toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) window.history.replaceState({}, "", next);
  }, [campaign]);

  useEffect(() => {
    const scrollToHash = () => {
      const targetId = window.location.hash.slice(1);
      if (!targetId) return;
      window.requestAnimationFrame(() => {
        window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ block: "start" }), 0);
      });
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTopButton(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let armed = false;
    const armTimer = window.setTimeout(() => { armed = true; }, 8000);
    const mobileTimer = window.setTimeout(() => {
      if (window.innerWidth < 768 && !sessionStorage.getItem("cairn-checklist-dismissed")) {
        setShowLeadModal(true);
      }
    }, 45000);
    const onLeave = (event: MouseEvent) => {
      if (
        armed &&
        event.clientY <= 0 &&
        window.innerWidth >= 768 &&
        !sessionStorage.getItem("cairn-checklist-dismissed")
      ) {
        setShowLeadModal(true);
      }
    };
    document.addEventListener("mouseout", onLeave);
    return () => {
      window.clearTimeout(armTimer);
      window.clearTimeout(mobileTimer);
      document.removeEventListener("mouseout", onLeave);
    };
  }, []);

  const proPlan = proPricing[proBilling];
  const premiumPlan = premiumPricing[premiumBilling];
  const cadence = (cycle: BillingCycle) => (cycle === "monthly" ? t.pricing.perMonth : t.pricing.perYear);
  const premiumPaymentLink = premiumPaymentLinks[premiumBilling];

  const handlePremiumCheckout = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (premiumPaymentLink) return;
    event.preventDefault();
    toast.message("Stripe Payment Link required", {
      description: `Add VITE_STRIPE_PREMIUM_${premiumBilling.toUpperCase()}_PAYMENT_LINK to activate this checkout button.`,
    });
  };

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    const website = honeypot(event.currentTarget);
    if (!leadCaptureEndpoint) {
      toast.error("Database capture is not configured for this preview", {
        description: "Add VITE_LEAD_CAPTURE_ENDPOINT before collecting launch-notification signups.",
      });
      return;
    }

    setIsLeadSubmitting(true);
    try {
      const response = await fetch(leadCaptureEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "launch-notification", website }),
      });
      if (!response.ok) throw new Error("Lead capture request failed");
      if (!website) trackConversion({ name: "Signup", list: "launch" });
      toast.success(t.modal.successTitle, { description: t.modal.successBody });
      setEmail("");
      setShowLeadModal(false);
      sessionStorage.setItem("cairn-checklist-dismissed", "1");
    } catch {
      toast.error(t.modal.errorTitle, { description: t.modal.errorBody });
    } finally {
      setIsLeadSubmitting(false);
    }
  };

  const dismissLead = () => {
    setShowLeadModal(false);
    sessionStorage.setItem("cairn-checklist-dismissed", "1");
  };

  /**
   * Beta access. Same Worker route as the launch list, tagged source
   * "beta-request" so the owner's alert says what it is. On success the form
   * is replaced by the confirmation, and the launch-notification modal is
   * kept from asking this visitor for the same email again.
   */
  const submitBetaRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const address = betaEmail.trim();
    if (!address) return;
    const website = honeypot(event.currentTarget);
    setBetaStatus("submitting");
    setBetaError("");
    try {
      const response = await fetch(leadCaptureEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address, source: "beta-request", website }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || t.beta.error);
      }
      if (!website) trackConversion({ name: "Signup", list: "beta" });
      setBetaStatus("done");
      sessionStorage.setItem("cairn-checklist-dismissed", "1");
    } catch (error) {
      setBetaStatus("idle");
      setBetaError(error instanceof Error ? error.message : t.beta.error);
    }
  };

  return (
    <div className="site-shell">
      <div className="deadline-bar">
        <div className="container deadline-inner">
          <span className="deadline-main">
            <span><CalendarDays /> {t.bar.launch}</span>
            <span className="deadline-sep" aria-hidden="true">|</span>
            <span>{t.bar.beta}</span>
          </span>
          <span className="deadline-detail">{t.bar.guarantee}</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <a href="#top" className="wordmark" aria-label={t.nav.home}>
            <CairnMark />
            <span><strong>Cairn</strong><small>Careers</small></span>
          </a>
          <nav className="desktop-nav" aria-label={t.nav.primary}>
            <a href="#how-it-works">{t.nav.how}</a>
            <a href="#dashboard-preview">{t.nav.dashboard}</a>
            <a href="/roadmap">{t.nav.roadmap}</a>
            <a href="#pricing">{t.nav.pricing}</a>
            <a href="/methodology">{t.nav.methodology}</a>
            <a href="#about">{t.nav.about}</a>
          </nav>
          <div className="header-controls">
            <a className="header-cta" href="#beta-access">{t.nav.cta} <ArrowRight /></a>
            <LanguageSwitch />
            <button className="menu-button" onClick={() => setMobileOpen((value) => !value)} aria-label={t.nav.toggle}>
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="mobile-nav container" aria-label={t.nav.mobile}>
            <a onClick={() => setMobileOpen(false)} href="#how-it-works">{t.nav.how}</a>
            <a onClick={() => setMobileOpen(false)} href="#dashboard-preview">{t.nav.dashboard}</a>
            <a onClick={() => setMobileOpen(false)} href="/roadmap">{t.nav.roadmap}</a>
            <a onClick={() => setMobileOpen(false)} href="#pricing">{t.nav.pricing}</a>
            <a onClick={() => setMobileOpen(false)} href="#about">{t.nav.about}</a>
            <a onClick={() => setMobileOpen(false)} href="#faq">{t.nav.faq}</a>
            <a onClick={() => setMobileOpen(false)} href="/methodology">{t.nav.methodology}</a>
            {/* The call to action lives here on small screens. Kept in the
                header row it pushed the bar 175px past a 375px viewport. */}
            <a className="mobile-nav-cta" onClick={() => setMobileOpen(false)} href="#beta-access">{t.nav.cta} <ArrowRight /></a>
          </nav>
        )}
      </header>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd(t.faq.items) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: pageJsonLd({ type: "WebPage", path: "/", headline: t.hero.title.replace(/\.$/, ""), description: t.hero.definition }) }} />
      <main id="top">
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="hero-eyebrow">{message.eyebrow}</div>
              <h1>{t.hero.title}</h1>
              {/* Opens with a one-sentence "CairnCareers is ..." definition, the
                  shape search and answer engines lift verbatim. */}
              <p>{t.hero.definition} {message.body}</p>
              <div className="hero-actions">
                <a className="primary-cta" href="#beta-access">{t.nav.cta} <ArrowRight /></a>
                <a className="secondary-cta" href="#dashboard-preview">{t.hero.secondaryCta} <ArrowRight /></a>
              </div>
              <div className="purchase-context">
                <div><strong>{t.hero.launches}</strong><span>{t.hero.guarantee}</span></div>
              </div>
            </div>
            <div className="hero-visual" aria-label={t.hero.visualLabel}>
              <div className="hero-map">
                <img src={ASSETS.hero} srcSet={`${ASSETS.hero640} 640w, ${ASSETS.hero960} 960w, ${ASSETS.hero1280} 1280w, ${ASSETS.hero} 1600w`} sizes="(max-width: 1020px) calc(100vw - 32px), 46vw" alt={t.hero.imageAlt} width="1200" height="675" fetchPriority="high" />
                <RouteVeil />
              </div>
              <div className="hero-route-card">
                <span className="route-card-kicker">{t.hero.routeKicker}</span>
                <strong>{t.hero.routeTitle}</strong>
                <ol>
                  {t.hero.routeSteps.map((step, index) => <li key={step}><span>{index + 1}</span> {step}</li>)}
                </ol>
                <p className="route-card-note">{t.hero.routeNote}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label={t.trust.label}>
          <div className="container trust-strip-grid">
            <div><ShieldCheck /><span><strong>{t.trust.guarantee}</strong> {t.trust.guaranteeDetail}</span></div>
            <div><LockKeyhole /><span><strong>{t.trust.secure}</strong> {t.trust.secureDetail}</span></div>
            <div><BarChart3 /><span><strong>{t.trust.sources}</strong> {rich(t.trust.sourcesDetail)}</span></div>
          </div>
        </section>

        {FEATURED_IN.length > 0 && (
          <section className="featured-strip" aria-label={t.featured.label}>
            <div className="container featured-strip-inner">
              <span className="featured-label">{t.featured.label}</span>
              <ul>
                {FEATURED_IN.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} target="_blank" rel="noreferrer">
                      {item.logo ? <img src={`${BASE_URL}${item.logo}`} alt={item.name} height="24" loading="lazy" decoding="async" /> : item.name}
                      <ExternalLink aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <section id="how-it-works" className="paper-section route-section">
          <div className="container">
            <div className="section-heading split-heading">
              <div>
                <SectionLabel number="01">{t.route.label}</SectionLabel>
                <h2>{t.route.title}</h2>
              </div>
              <p>{t.route.lead}</p>
            </div>
            <div className="steps-grid">
              {t.route.steps.map(([title, body], index) => (
                <article key={title} className="step-card">
                  <span className="step-number">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
            <div className="route-example">
              <div><small>{t.route.example.beforeLabel}</small>{t.route.example.before}</div>
              <ArrowRight aria-hidden="true" />
              <div><small>{t.route.example.afterLabel}</small>{t.route.example.after}</div>
            </div>
            <p className="route-callout">{t.route.noResume}</p>
          </div>
        </section>

        <section className="ink-section degree-band">
          <div className="container">
            <span className="hero-eyebrow">{t.degree.eyebrow}</span>
            <h2>{t.degree.title}</h2>
            <p>{t.degree.body}</p>
          </div>
        </section>

        <section id="compare" className="paper-section compare-section">
          <div className="container">
            <div className="section-heading split-heading">
              <div>
                <SectionLabel number="02">{t.compare.label}</SectionLabel>
                <h2>{t.compare.title}</h2>
              </div>
              <p>{t.compare.lead}</p>
            </div>
            <div className="compare-grid">
              <article className="compare-card">
                <h3>{t.compare.chatbot.title}</h3>
                <ul>{t.compare.chatbot.points.map((point) => <li key={point}>{point}</li>)}</ul>
              </article>
              <article className="compare-card compare-ours">
                <h3>{t.compare.cairn.title}</h3>
                <ul>{t.compare.cairn.points.map((point) => <li key={point}>{point}</li>)}</ul>
              </article>
            </div>
            <p className="compare-links">
              <a href="/methodology">{t.compare.methodLink} <ArrowRight /></a>
              <a href="/vs/chatgpt">{t.compare.fullLink} <ArrowRight /></a>
            </p>
            {/* In-body links to the other comparisons. Linked only from the
                footer, they read to crawlers as listing-only pages. */}
            <p className="compare-others">
              {t.compare.othersLead} <a href="/vs/careerwing">CairnCareers vs CareerWing</a>, <a href="/vs/career-mirror">CairnCareers vs Career Mirror</a>, <a href="/vs/maketheleap">CairnCareers vs Make the Leap</a>.
            </p>
          </div>
        </section>

        <section id="dashboard-preview" className="ink-section sample-dashboard-section">
          <div className="container">
            <div className="sample-dashboard-heading">
              <SectionLabel number="03">{t.dashboard.label}</SectionLabel>
              <h2>{t.dashboard.titleLine1}<br /> {t.dashboard.titleLine2}</h2>
            </div>

            <div className="sample-dashboard-frame" aria-label={t.dashboard.frameLabel}>
              <div className="sample-dashboard-frame-head"><span>{t.dashboard.kicker}</span><strong>{t.dashboard.stand}</strong><span>{t.dashboard.sample}</span></div>
              <div className="sample-dashboard-overview">
                <article className="sample-dashboard-metric lime-metric"><span>{t.dashboard.coverage}</span><strong>68</strong><small>{t.dashboard.coverageSub}</small></article>
                <article className="sample-dashboard-metric pink-metric"><span>{t.dashboard.ai}</span><strong>54%</strong><div className="mini-bar"><i /></div><small>{t.dashboard.aiSub}</small></article>
                <article className="sample-dashboard-metric amber-metric"><span>{t.dashboard.readiness}</span><strong>64</strong><div className="mini-bar"><i /></div><small>{t.dashboard.readinessSub}</small></article>
              </div>
              <div className="sample-dashboard-modules" aria-label={t.dashboard.modulesLabel}>
                {dashboardAreas.map((area, index) => (
                  <a key={area.number} className={`module-route-card ${area.accent}`} href={area.href} aria-label={`${t.dashboard.open} ${t.dashboard.areas[index].title}`}>
                    <span className="module-route-number">{area.number}</span>
                    <strong>{t.dashboard.areas[index].title}</strong>
                    <ExternalLink aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        {SHOW_PROOF_QUEUE && (
        <section id="proof" className="paper-section proof-section" hidden aria-hidden="true">
            <div className="container">
              <div className="section-heading split-heading">
                <div>
                  <SectionLabel number="04">Permissioned proof queue</SectionLabel>
                  <h2>Build proof without pretending it already exists.</h2>
                </div>
                <p>Every slot below stays visibly unpublished until a real student grants permission and the result can be verified.</p>
              </div>
  
              <div className="outcomes-panel">
                <div className="outcomes-map-bg" aria-hidden="true"><i /><i /><i /></div>
                <div className="outcomes-content">
                  <div className="outcomes-heading">
                    <span className="slot-badge">Verified outcomes · reserved</span>
                    <h3>Publish only what can be sourced.</h3>
                  </div>
                  <div className="metrics-grid">
                    <MetricSlot label="Students mapped" />
                    <MetricSlot label="Next moves completed" />
                    <MetricSlot label="Time to first useful route" />
                  </div>
                </div>
              </div>
  
              <div className="story-grid">
                <ProofPhotoSlot index={1} />
                <ProofPhotoSlot index={2} />
                <ProofPhotoSlot index={3} />
              </div>
  
              <div className="video-rating-grid">
                <article className="video-slot">
                  <div className="video-art">
                    <div className="video-illustration" aria-label="Illustrative empty interview set reserved for a future permissioned student video">
                      <div className="studio-light" />
                      <div className="empty-chair"><i /><i /><i /></div>
                      <div className="microphone"><i /></div>
                      <div className="studio-route"><i /><i /><i /></div>
                    </div>
                    <CirclePlay aria-hidden="true" />
                  </div>
                  <div>
                    <span className="slot-badge">Permissioned video story · reserved</span>
                    <h3>Before, after, and the verified result between.</h3>
                    <p>Required: a real student, explicit consent, and one measurable change worth showing.</p>
                  </div>
                </article>
                <article className="rating-slot">
                  <div className="rating-mark">★ &nbsp;/ 5</div>
                  <span className="slot-badge">Third-party rating · reserved</span>
                  <h3>Connect one verified review profile.</h3>
                  <p>Use G2, Capterra, Trustpilot, Product Hunt, App Store, or an equivalent source only after the profile and rating are live.</p>
                  <div className="source-placeholder">Verified source URL required <ArrowRight /></div>
                </article>
              </div>
            </div>
          </section>
        )}

        <section id="beta-access" className="beta-section">
          <div className="container">
            <div className="beta-panel">
              <span className="hero-eyebrow">{t.beta.eyebrow}</span>
              <h2>{t.beta.title}</h2>
              {betaStatus === "done" ? (
                <div className="beta-confirmation" role="status">
                  <Check aria-hidden="true" />
                  <p>{t.beta.confirmation}</p>
                </div>
              ) : (
                <>
                  <p>{t.beta.lead}</p>
                  {betaCount !== null && (
                    <div className="beta-counter">
                      <strong>{t.beta.counter.replace("{count}", betaCount.toLocaleString())}<sup><a href="#beta-count-note" aria-label="1">1</a></sup></strong>
                      <small id="beta-count-note">1. {rich(t.beta.counterNote)}</small>
                    </div>
                  )}
                  <form className="email-form beta-form" onSubmit={submitBetaRequest}>
                    <label htmlFor="beta-email">{t.beta.emailLabel}</label>
                    <div>
                      <Mail />
                      <input id="beta-email" type="email" required autoComplete="email" placeholder={t.beta.placeholder} value={betaEmail} onChange={(event) => setBetaEmail(event.target.value)} />
                      <button type="submit" disabled={betaStatus === "submitting"}>{betaStatus === "submitting" ? t.beta.saving : t.beta.submit} <ArrowRight /></button>
                    </div>
                    {betaError && <p className="form-error" role="alert">{betaError}</p>}
                    <label className="sr-only" aria-hidden="true">
                      Website
                      <input name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        <section id="pricing" className="pricing-section">
          <div className="container">
            <div className="section-heading split-heading">
              <div>
                <SectionLabel number="04">{t.pricing.label}</SectionLabel>
                <h2>{t.pricing.title}</h2>
              </div>
            </div>

            <div className="pricing-grid">
              <article className="price-card">
                <span className="price-for">{t.pricing.free.for}</span>
                <h3>{t.pricing.free.name}</h3>
                <div className="price"><strong>{t.pricing.free.price}</strong><span>{t.pricing.free.cadence}</span></div>
                <ul>{t.pricing.free.features.map((f) => <li key={f}><Check /> {f}</li>)}</ul>
              </article>
              <article className="price-card">
                <span className="price-for">{t.pricing.pro.for}</span>
                <h3>{t.pricing.pro.name}</h3>
                <div className="price-toggle" role="group" aria-label={t.pricing.proGroup}>
                  <span>{t.pricing.chooseBilling}</span>
                  <div>
                    <button type="button" aria-pressed={proBilling === "monthly"} className={proBilling === "monthly" ? "active" : ""} onClick={() => setProBilling("monthly")}>{t.pricing.monthly}</button>
                    <button type="button" aria-pressed={proBilling === "annual"} className={proBilling === "annual" ? "active" : ""} onClick={() => setProBilling("annual")}>{t.pricing.annual}</button>
                  </div>
                </div>
                <div className="price"><strong>{price(proPlan.usd)}</strong><span>{currency} {cadence(proBilling)}</span>{proPlan.savings && <em className="price-saving">{t.pricing.savings}</em>}</div>
                <ul>{t.pricing.pro.features.map((f) => <li key={f}><Check /> {f}</li>)}</ul>
              </article>
              <article id="premium-checkout" className="price-card featured-price">
                {SHOW_DISCOUNTED_PRICING && <div className="price-ribbon">{t.pricing.ribbon}</div>}
                <span className="price-for">{t.pricing.premium.for}</span>
                <h3>{t.pricing.premium.name}</h3>
                <div className="price-toggle premium-toggle" role="group" aria-label={t.pricing.premiumGroup}>
                  <span>{t.pricing.chooseBilling}</span>
                  <div>
                    <button type="button" aria-pressed={premiumBilling === "monthly"} className={premiumBilling === "monthly" ? "active" : ""} onClick={() => setPremiumBilling("monthly")}>{t.pricing.monthly}</button>
                    <button type="button" aria-pressed={premiumBilling === "annual"} className={premiumBilling === "annual" ? "active" : ""} onClick={() => setPremiumBilling("annual")}>{t.pricing.annual}</button>
                  </div>
                </div>
                {SHOW_DISCOUNTED_PRICING ? (
                  <div className="price"><s>{price(premiumPlan.regular)} · {t.pricing.savings}</s><strong>{price(premiumPlan.prelaunch)}</strong><span>{currency} {cadence(premiumBilling)}</span><em className="prelaunch-label">{t.pricing.prelaunchLabel}</em><small className="limited-spots">{t.pricing.limitedSpots}</small></div>
                ) : (
                  <div className="price"><strong>{price(premiumPlan.regular)}</strong><span>{currency} {cadence(premiumBilling)}</span>{premiumPlan.savings && <em className="price-saving">{t.pricing.savings}</em>}</div>
                )}
                <ul>{t.pricing.premium.features.map((f) => <li key={f}><Check /> {f}</li>)}</ul>
                {CHECKOUT_OPEN ? (
                  <a className="primary-cta full-cta" href={premiumPaymentLink || "#stripe-payment-link"} onClick={handlePremiumCheckout} target={premiumPaymentLink ? "_blank" : undefined} rel={premiumPaymentLink ? "noreferrer" : undefined}>{t.pricing.checkout} <ArrowRight /></a>
                ) : (
                  <button type="button" className="primary-cta full-cta" disabled>{t.pricing.checkoutClosed}</button>
                )}
                {CHECKOUT_OPEN && !premiumPaymentLink && (
                  // Build-time hint only. Both links are configured, so this does not
                  // render in production; it used to, telling buyers at the checkout
                  // button that checkout was not set up.
                  <div id="stripe-payment-link" className="checkout-note"><LockKeyhole /> Stripe Payment Link for Premium {premiumBilling} will open here when configured.</div>
                )}
              </article>
              {/* Last in the grid on purpose: the card styles above count
                  children (nth-child), and the running line must not shift them. */}
              {!SHOW_DISCOUNTED_PRICING && <BetaTicker text={t.pricing.ticker} />}
            </div>

            <p className="pricing-why">{rich(t.pricing.whySubscription)}</p>
            <p className="pricing-note">{t.pricing.groupNote} <a href="mailto:contact@cairncareers.com">contact@cairncareers.com</a></p>
            {currency !== "USD" && <p className="pricing-approx">{t.pricing.approx.replace("{currency}", currency)}</p>}
          </div>
        </section>

        <section id="about" className="about-section">
          <div className="container about-grid">
            <div>
              <SectionLabel number="05">{t.about.label}</SectionLabel>
              <h2>{t.about.title}</h2>
              <article className="founder-card">
                <img src={ASSETS.founder} alt={t.about.imageAlt} width="300" height="300" loading="lazy" decoding="async" />
                <div><span className="slot-badge">{t.about.badge}</span><h3><a href="https://www.linkedin.com/in/brookehouck" target="_blank" rel="noreferrer">{t.about.founder}</a></h3><p>{t.about.quote}</p>
                  {FOUNDER_VIDEO && (
                    <video className="founder-video" controls preload="none" playsInline width="640" height="360" poster={`${BASE_URL}${FOUNDER_VIDEO.poster}`} aria-label={t.about.videoLabel}>
                      <source src={`${BASE_URL}${FOUNDER_VIDEO.src}`} type="video/mp4" />
                      <track kind="captions" src={`${BASE_URL}${FOUNDER_VIDEO.captions}`} srcLang="en" label="English" default />
                    </video>
                  )}
                </div>
              </article>
            </div>
          </div>
        </section>

        {BETA_QUOTES.length > 0 && (
          <section id="beta-testers" className="paper-section testimonials-section">
            <div className="container">
              <SectionLabel number="06">{t.testimonials.label}</SectionLabel>
              <h2>{t.testimonials.title}</h2>
              <div className="testimonials-grid">
                {BETA_QUOTES.map((item) => (
                  <figure className="testimonial-card" key={item.name + item.who}>
                    <blockquote>{item.quote}</blockquote>
                    <figcaption><strong>{item.name}</strong> {item.who}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="faq" className="paper-section faq-section">
          <div className="container">
            <SectionLabel number={BETA_QUOTES.length > 0 ? "07" : "06"}>{t.faq.label}</SectionLabel>
            <h2>{t.faq.title}</h2>
            <div className="faq-list">
              {t.faq.items.map((item) => (
                <article className="faq-item" key={item.q}>
                  <h3>{item.q}</h3>
                  <p>{rich(item.a)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="closing-section">
          <div className="container closing-inner">
            <span className="hero-eyebrow">{t.closing.eyebrow}</span>
            <h2>{t.closing.title}</h2>
            <div className="closing-actions">
              <a className="primary-cta" href="#beta-access">{t.nav.cta} <ArrowRight /></a>
              <a className="secondary-cta closing-secondary" href="#dashboard-preview">{t.hero.secondaryCta} <ArrowRight /></a>
            </div>
            <p>{t.closing.line}</p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand-block"><div className="wordmark footer-mark"><CairnMark /><span><strong>Cairn</strong><small>Careers</small></span></div><p>{t.footer.tagline}</p><p className="footer-product-line">{rich(t.footer.productLine)}</p></div>
          <div className="footer-links"><a href="mailto:contact@cairncareers.com">contact@cairncareers.com</a><span><a href="/methodology">{t.footer.methodology}</a> · <a href="/privacy">{t.footer.privacy}</a> · <a href="/terms">{t.footer.terms}</a> · <a href="/refunds">{t.footer.refunds}</a> · <a href="/contact">{t.footer.contact}</a></span><span className="footer-compare">{t.footer.compare} <a href="/vs/chatgpt">ChatGPT</a> · <a href="/vs/careerwing">CareerWing</a> · <a href="/vs/career-mirror">Career Mirror</a> · <a href="/vs/maketheleap">Make the Leap</a></span></div>
        </div>
      </footer>

      {showTopButton && (
        <button className="site-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label={t.legal.backToTop}><ArrowUp /></button>
      )}

      {showLeadModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) dismissLead(); }}>
          <div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
            <button className="modal-close" onClick={dismissLead} aria-label={t.modal.close}><X /></button>
            <span className="slot-badge">{t.modal.badge}</span>
            <h2 id="lead-modal-title">{t.modal.title}</h2>
            <p>{t.modal.lead}</p>
            <form className="email-form modal-form" onSubmit={submitLead}>
              <label htmlFor="modal-email">{t.modal.emailLabel}</label>
              <div><Mail /><input id="modal-email" type="email" required placeholder={t.beta.placeholder} value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              <button type="submit" className="primary-cta" disabled={isLeadSubmitting}>{isLeadSubmitting ? t.modal.saving : t.modal.submit} <ArrowRight /></button>
              <label className="sr-only" aria-hidden="true">
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
