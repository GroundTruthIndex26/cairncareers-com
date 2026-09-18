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
  ChevronDown,
  CirclePlay,
  ExternalLink,
  Globe2,
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
import { toast } from "sonner";

const BASE_URL = import.meta.env.BASE_URL;
const ASSETS = {
  hero: `${BASE_URL}media/cairn-route-map-hero.webp`,
  founder: `${BASE_URL}media/cairn-founder.webp`,
};

const BRAND_ASSETS = {
  icon: `${BASE_URL}brand/cairn-icon.svg`,
  lightLogo: `${BASE_URL}brand/cairn-logo-light.svg`,
  darkLogo: `${BASE_URL}brand/cairn-logo-dark.svg`,
};

const leadCaptureEndpoint = import.meta.env.VITE_LEAD_CAPTURE_ENDPOINT || "/api/launch-notifications";

type LocaleKey = "en-US" | "en-CA" | "en-GB";
type CampaignKey = "default" | "campus" | "social";
type BillingCycle = "monthly" | "annual";

const proPricing: Record<BillingCycle, { price: string; cadence: string; savings?: string }> = {
  monthly: { price: "US$6", cadence: "USD / month" },
  annual: { price: "US$46", cadence: "USD / year", savings: "35% savings" },
};

const premiumPricing: Record<BillingCycle, { regular: string; prelaunch: string; cadence: string; savings?: string }> = {
  monthly: { regular: "US$11", prelaunch: "US$8", cadence: "USD / month" },
  annual: { regular: "US$86", prelaunch: "US$61", cadence: "USD / year", savings: "35% savings" },
};

/**
 * The discounted pricing cards, saved on September 18, 2026 to bring back on
 * November 1: Premium at US$8/month or US$61/year with the regular price struck
 * through, "Limited Time prelaunch price" labels, and both billing toggles
 * starting on annual. Set this to true to restore them. That also drops the
 * "Beta users free until launch!" running line, which stops being true at launch.
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
 * The header's country picker. It is meant to switch the page's language and
 * the currency prices are shown in; neither is built yet, so for now it only
 * sets the document language and the ?locale= query.
 */
const localeOptions: Record<LocaleKey, { label: string; short: string }> = {
  "en-US": { label: "United States · English", short: "US · USD" },
  "en-CA": { label: "Canada · English (pilot)", short: "CA · CAD" },
  "en-GB": { label: "United Kingdom · English (pilot)", short: "UK · GBP" },
};

/**
 * The permissioned-proof queue is written and ready, but every slot in it is
 * still empty. Rendering it shipped roughly 1.5 KB of "reserved story 1",
 * "publish with cohort, date range, and source" and the review-site checklist
 * into the HTML of every visitor and crawler. `hidden` stops it being seen, not
 * being read. Flip this to true once there is a verified story to publish.
 */
const SHOW_PROOF_QUEUE = false;

const campaignVariants: Record<
  CampaignKey,
  { label: string; eyebrow: string; body: string }
> = {
  default: {
    label: "Default",
    eyebrow: "For college students and recent graduates",
    body: "Compare realistic career paths using salary, job growth, and AI context, then leave with a next move you can explain.",
  },
  campus: {
    label: "Campus partner",
    eyebrow: "From campus to a first role that fits",
    body: "Turn your coursework, experiences, and interests into a career route you can discuss with an adviser, professor, or recruiter.",
  },
  social: {
    label: "Paid social",
    eyebrow: "Worried AI changes your first-job options?",
    body: "See which tasks are exposed, which skills stay durable, and what to do next, without asking a general chatbot to guess.",
  },
};

const steps = [
  ["01", "Bring what you know", "Your interests, coursework, experience, and the work that holds your attention."],
  ["02", "Read the whole picture", "Salary, job growth, and AI exposure in one place, not isolated numbers."],
  ["03", "Leave with a route", "A practical LinkedIn, networking, and first-conversation direction."],
];

const dashboardAreas = [
  {
    number: "01",
    title: "Evidence",
    body: "Turn real work into proof that strengthens a resume bullet, LinkedIn line, and interview answer.",
    href: `${BASE_URL}dashboard-preview/evidence`,
    accent: "lime",
  },
  {
    number: "02",
    title: "Portfolio",
    body: "Keep the work itself beside the claim it supports: case studies, reports, prototypes, and decks.",
    href: `${BASE_URL}dashboard-preview/portfolio`,
    accent: "cyan",
  },
  {
    number: "03",
    title: "Resume",
    body: "See how one update can carry through a clean, standard resume built from real evidence.",
    href: `${BASE_URL}dashboard-preview/resume`,
    accent: "pink",
  },
  {
    number: "04",
    title: "LinkedIn",
    body: "Preview copyable profile blocks without scraping, password requests, or opaque automation.",
    href: `${BASE_URL}dashboard-preview/linkedin`,
    accent: "amber",
  },
  {
    number: "05",
    title: "Network",
    body: "Follow warm paths and use the exact message that makes a first outreach easier to send.",
    href: `${BASE_URL}dashboard-preview/network`,
    accent: "cyan",
  },
  {
    number: "06",
    title: "Interview",
    body: "Practice clear standard and role-specific answers grounded in evidence you can explain.",
    href: `${BASE_URL}dashboard-preview/interview`,
    accent: "lime",
  },
  {
    number: "07",
    title: "Careers",
    body: "Compare pay, growth, work location, and AI context without pretending money changes the score.",
    href: `${BASE_URL}dashboard-preview/careers`,
    accent: "amber",
  },
  {
    number: "08",
    title: "Roadmap",
    body: "See a term-by-term route that closes the biggest evidence gaps first.",
    href: "/roadmap",
    accent: "pink",
  },
  {
    number: "09",
    title: "Clean-up",
    body: "Understand the privacy-first path for sensitive context that should never be described to a model.",
    href: `${BASE_URL}dashboard-preview/cleanup`,
    accent: "lime",
  },
];

/**
 * FAQ content, single-sourced.
 *
 * The visible markup and the FAQPage JSON-LD below are both generated from
 * this one array, so the structured data can never drift from what a reader
 * actually sees, which is the requirement structured data has to meet.
 *
 * WHY THESE ANSWERS ARE SHAPED THIS WAY
 * Every answer states its conclusion in the first sentence and stands on its
 * own without the question or the neighbouring answers. That is what an
 * answer engine can lift cleanly. Ten pages linked to /#faq for a section
 * that did not exist, so this also fixes a dead anchor sitewide.
 */
const FAQS: { q: string; a: React.ReactNode; plain: string }[] = [
  {
    q: "What is Cairn Careers?",
    a: <>Cairn Careers is a career-planning tool for college students and recent graduates. It turns your interests, coursework, and experience into an AI-exposure score for each career path you are weighing, alongside a sequenced plan toward a first job. It is a product of Phronesis Labs LLC and is not affiliated with Cairn University or Cairn Group.</>,
    plain: "Cairn Careers is a career-planning tool for college students and recent graduates. It turns your interests, coursework, and experience into an AI-exposure score for each career path you are weighing, alongside a sequenced plan toward a first job. It is a product of Phronesis Labs LLC and is not affiliated with Cairn University or Cairn Group.",
  },
  {
    q: "How is the AI-exposure score calculated?",
    a: <>Each task in an occupation is weighted by how much of the work it accounts for, multiplied by that task's AI-exposure value, and the result is placed on a 0 to 100 scale. Task data comes from O*NET, exposure values from Eloundou et al. (2024) in Science, and the outlook from METR's long-run time-horizon trend. The full calculation is set out on the <a href="/methodology">methodology page</a>.</>,
    plain: "Each task in an occupation is weighted by how much of the work it accounts for, multiplied by that task's AI-exposure value, and the result is placed on a 0 to 100 scale. Task data comes from O*NET, exposure values from Eloundou et al. (2024) in Science, and the outlook from METR's long-run time-horizon trend. The full calculation is set out on the methodology page at https://cairncareers.com/methodology.",
  },
  {
    q: "Does the score predict whether I will lose my job?",
    a: <>No. The score measures task exposure, meaning what current AI can already do, not whether a particular job will disappear. It cannot see your employer, your skill, your judgment, or the relationships you build, and it is not career, financial, or legal advice.</>,
    plain: "No. The score measures task exposure, meaning what current AI can already do, not whether a particular job will disappear. It cannot see your employer, your skill, your judgment, or the relationships you build, and it is not career, financial, or legal advice.",
  },
  {
    q: "Which entry-level jobs are most exposed to AI?",
    a: <>Exposure follows the mix of tasks inside a job rather than the job title, so two roles that sound similar can score very differently. Work that is mostly drafting, summarizing, routine analysis, or standardized documentation tends to score higher, while work that turns on physical presence, negotiation, or accountability for a judgment call tends to score lower. Cairn Careers scores the specific paths you are weighing rather than publishing one general ranking.</>,
    plain: "Exposure follows the mix of tasks inside a job rather than the job title, so two roles that sound similar can score very differently. Work that is mostly drafting, summarizing, routine analysis, or standardized documentation tends to score higher, while work that turns on physical presence, negotiation, or accountability for a judgment call tends to score lower. Cairn Careers scores the specific paths you are weighing rather than publishing one general ranking.",
  },
  {
    q: "Do I need a resume or work history to use it?",
    a: <>No. You bring your interests, your coursework, and the experience you already have, including class projects and part-time work. There is no resume upload and no work-history requirement.</>,
    plain: "No. You bring your interests, your coursework, and the experience you already have, including class projects and part-time work. There is no resume upload and no work-history requirement.",
  },
  {
    q: "How is this different from asking a general AI chatbot about my career?",
    a: <>A general chatbot produces an answer from patterns in its training data and cannot show you where a number came from. Cairn Careers scores your paths against federal occupational task data and published research, names and links every source on its <a href="/methodology">methodology page</a>, and keeps pay and growth data structurally separate from the exposure score so you can see exactly what moved the result.</>,
    plain: "A general chatbot produces an answer from patterns in its training data and cannot show you where a number came from. Cairn Careers scores your paths against federal occupational task data and published research, names and links every source on its methodology page, and keeps pay and growth data structurally separate from the exposure score so you can see exactly what moved the result.",
  },
  {
    q: "Where does Cairn Careers get its data?",
    a: <>Occupational task data comes from O*NET, the U.S. Department of Labor's occupational database. AI task exposure comes from Eloundou et al. (2024) in Science. The capability trajectory comes from METR. Pay and growth figures come from the U.S. Bureau of Labor Statistics and are shown as context only, and they never enter the exposure score. Every source is linked on the <a href="/methodology">methodology page</a>.</>,
    plain: "Occupational task data comes from O*NET, the U.S. Department of Labor's occupational database. AI task exposure comes from Eloundou et al. (2024) in Science. The capability trajectory comes from METR. Pay and growth figures come from the U.S. Bureau of Labor Statistics and are shown as context only, and they never enter the exposure score. Every source is linked on the methodology page.",
  },
  {
    q: "Who is Cairn Careers for?",
    a: <>College students and recent graduates deciding what to aim for and what to do next. It is most useful if you are choosing between several paths, or have already chosen one and want a month-by-month plan toward a first job. You can see that plan in the <a href="/roadmap">sample roadmap</a>.</>,
    plain: "College students and recent graduates deciding what to aim for and what to do next. It is most useful if you are choosing between several paths, or have already chosen one and want a month-by-month plan toward a first job.",
  },
  {
    q: "What does Cairn Careers cost?",
    a: <>Premium is $11 a month or $86 a year. Pro is $6 a month or $46 a year. Until launch on October 31, 2026, beta users can use Cairn Careers free. Every purchase is covered by a 30-day money-back guarantee, described on the <a href="/refunds">refund policy page</a>.</>,
    plain: "Premium is $11 a month or $86 a year. Pro is $6 a month or $46 a year. Until launch on October 31, 2026, beta users can use Cairn Careers free. Every purchase is covered by a 30-day money-back guarantee.",
  },
];

/** FAQPage structured data built from the same FAQS array shown on the page. */
function faqJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.plain },
    })),
  });
}

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
  const [locale, setLocale] = useState<LocaleKey>("en-US");
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
  const message = campaignVariants[campaign];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = (params.get("utm_source") || params.get("source") || "").toLowerCase();
    const localeParam = params.get("locale") as LocaleKey | null;
    if (source.includes("campus")) setCampaign("campus");
    if (source.includes("social")) setCampaign("social");
    if (localeParam && localeOptions[localeParam]) setLocale(localeParam);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    /* Only a non-default choice is written into the URL. Rewriting every visit
       to /?locale=en-US replaced the bare URL in the browser's history before
       its title had landed, so browsers kept whatever title this domain served
       before CairnCareers existed as the title for https://cairncareers.com/.
       It also put a query string on every link people copied. */
    const params = new URLSearchParams(window.location.search);
    if (locale === "en-US") params.delete("locale");
    else params.set("locale", locale);
    if (campaign === "default") params.delete("source");
    else params.set("source", campaign);
    const query = params.toString();
    const next = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) window.history.replaceState({}, "", next);
  }, [campaign, locale]);

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
        body: JSON.stringify({ email: email.trim(), source: "launch-notification" }),
      });
      if (!response.ok) throw new Error("Lead capture request failed");
      toast.success("You are on the launch-notification list.", {
        description: "We will use this email to let you know when CairnCareers is live.",
      });
      setEmail("");
      setShowLeadModal(false);
      sessionStorage.setItem("cairn-checklist-dismissed", "1");
    } catch {
      toast.error("We could not save your email address", {
        description: "The checklist was not downloaded. Please try again after the database connection is restored.",
      });
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
    setBetaStatus("submitting");
    setBetaError("");
    try {
      const response = await fetch(leadCaptureEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: address, source: "beta-request" }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "We could not save your request. Please try again.");
      }
      setBetaStatus("done");
      sessionStorage.setItem("cairn-checklist-dismissed", "1");
    } catch (error) {
      setBetaStatus("idle");
      setBetaError(error instanceof Error ? error.message : "We could not save your request. Please try again.");
    }
  };

  return (
    <div className="site-shell">
      <div className="deadline-bar">
        <div className="container deadline-inner">
          <span className="deadline-main">
            <span><CalendarDays /> Launch Oct. 31</span>
            <span className="deadline-sep" aria-hidden="true">|</span>
            <span>Free for beta users until launch</span>
          </span>
          <span className="deadline-detail">30-day money-back guarantee</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <a href="#top" className="wordmark" aria-label="CairnCareers home">
            <CairnMark />
            <span><strong>Cairn</strong><small>Careers</small></span>
          </a>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#dashboard-preview">Sample Dashboard</a>
            <a href="/roadmap">Roadmap</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
          </nav>
          <div className="header-controls">
            <a className="header-cta" href="#beta-access">Show me my career paths <ArrowRight /></a>
            <label className="compact-select">
              <Globe2 aria-hidden="true" />
              <span className="sr-only">Country and currency</span>
              <select
                value={locale}
                onChange={(event) => {
                  setLocale(event.target.value as LocaleKey);
                  toast.message(`Locale preview: ${localeOptions[event.target.value as LocaleKey].label}`);
                }}
              >
                {Object.entries(localeOptions).map(([key, option]) => (
                  <option key={key} value={key}>{option.short}</option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" />
            </label>
            <button className="menu-button" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation">
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="mobile-nav container" aria-label="Mobile navigation">
            <a onClick={() => setMobileOpen(false)} href="#how-it-works">How it works</a>
            <a onClick={() => setMobileOpen(false)} href="#dashboard-preview">Sample Dashboard</a>
            <a onClick={() => setMobileOpen(false)} href="/roadmap">Roadmap</a>
            <a onClick={() => setMobileOpen(false)} href="#pricing">Pricing</a>
            <a onClick={() => setMobileOpen(false)} href="#about">About</a>
            <a onClick={() => setMobileOpen(false)} href="#faq">FAQ</a>
            <a onClick={() => setMobileOpen(false)} href="/methodology">Methodology</a>
            {/* The call to action lives here on small screens. Kept in the
                header row it pushed the bar 175px past a 375px viewport. */}
            <a className="mobile-nav-cta" onClick={() => setMobileOpen(false)} href="#beta-access">Show me my career paths <ArrowRight /></a>
          </nav>
        )}
      </header>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd() }} />
      <main id="top">
        <section className="hero-section">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="hero-eyebrow">{message.eyebrow}</div>
              <h1>Find an entry-level path that holds up to AI.</h1>
              <p>{message.body}</p>
              <div className="hero-actions">
                <a className="primary-cta" href="#beta-access">Show me my career paths <ArrowRight /></a>
              </div>
              <div className="purchase-context">
                <div><strong>Launches Oct. 31</strong><span>30-day money-back guarantee</span></div>
              </div>
            </div>
            <div className="hero-visual" aria-label="Career route from self-knowledge to an evidence-supported next move">
              <div className="hero-map">
                <img src={ASSETS.hero} alt="Abstract route map with three career-planning waypoints" width="1200" height="675" fetchPriority="high" />
                <RouteVeil />
              </div>
              <div className="hero-route-card">
                <span className="route-card-kicker">A steadier way forward</span>
                <strong>Three signals. One next move.</strong>
                <ol>
                  <li><span>1</span> What you know</li>
                  <li><span>2</span> Market context</li>
                  <li><span>3</span> A route to test</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Trust and risk reversal">
          <div className="container trust-strip-grid">
            <div><ShieldCheck /><span><strong>30-day money-back guarantee</strong> · pre-launch: from launch · after launch: from purchase</span></div>
            <div><LockKeyhole /><span><strong>Secure checkout</strong> handled by Stripe</span></div>
          </div>
        </section>

        <section id="how-it-works" className="paper-section route-section">
          <div className="container">
            <div className="section-heading split-heading">
              <div>
                <SectionLabel number="01">The route</SectionLabel>
                <h2>Career planning that ends with a first move.</h2>
              </div>
              <p>Your map should make the next decision smaller, more specific, and easier to test in the real world.</p>
            </div>
            <div className="steps-grid">
              {steps.map(([number, title, body]) => (
                <article key={number} className="step-card">
                  <span className="step-number">{number}</span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="dashboard-preview" className="ink-section sample-dashboard-section">
          <div className="container">
            <div className="sample-dashboard-heading">
              <SectionLabel number="03">Sample Dashboard</SectionLabel>
              <h2>Meet Maya.<br /> See Maya's sample dashboard before you decide.</h2>
            </div>

            <div className="sample-dashboard-frame" aria-label="Illustrative Sample Dashboard preview">
              <div className="sample-dashboard-frame-head"><span>PREMIUM DASHBOARD</span><strong>Where you stand, Maya.</strong><span>Sample data</span></div>
              <div className="sample-dashboard-overview">
                <article className="sample-dashboard-metric lime-metric"><span>Coverage</span><strong>68</strong><small>of 100 · up 12 this term</small></article>
                <article className="sample-dashboard-metric pink-metric"><span>What AI already does</span><strong>54%</strong><div className="mini-bar"><i /></div><small>Moderate exposure</small></article>
                <article className="sample-dashboard-metric amber-metric"><span>Readiness</span><strong>64</strong><div className="mini-bar"><i /></div><small>One private clean-up flag</small></article>
              </div>
              <div className="sample-dashboard-modules" aria-label="Sample Dashboard pages">
                {dashboardAreas.map((area) => (
                  <a key={area.title} className={`module-route-card ${area.accent}`} href={area.href} aria-label={`Open ${area.title}`}>
                    <span className="module-route-number">{area.number}</span>
                    <strong>{area.title}</strong>
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
              <span className="hero-eyebrow">Beta access</span>
              <h2>Use CairnCareers free until launch.</h2>
              {betaStatus === "done" ? (
                <div className="beta-confirmation" role="status">
                  <Check aria-hidden="true" />
                  <p>We are still building, but can't wait for you to use CairnCareers. You will receive an email when your account is fully activated.</p>
                </div>
              ) : (
                <>
                  <p>Leave your email and we will set up your account.</p>
                  <form className="email-form beta-form" onSubmit={submitBetaRequest}>
                    <label htmlFor="beta-email">Email address</label>
                    <div>
                      <Mail />
                      <input id="beta-email" type="email" required autoComplete="email" placeholder="you@school.edu" value={betaEmail} onChange={(event) => setBetaEmail(event.target.value)} />
                      <button type="submit" disabled={betaStatus === "submitting"}>{betaStatus === "submitting" ? "Saving…" : "Request beta access"} <ArrowRight /></button>
                    </div>
                    {betaError && <p className="form-error" role="alert">{betaError}</p>}
                    <small>One email when your account is ready. No newsletter.</small>
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
                <SectionLabel number="04">Pricing</SectionLabel>
                <h2>See the price before checkout.</h2>
              </div>
            </div>
          </div>

          {!SHOW_DISCOUNTED_PRICING && <BetaTicker text="Beta users free until launch!" />}

          <div className="container">
            <div className="pricing-grid">
              <article className="price-card">
                <span className="price-for">Where do I stand?</span>
                <h3>Free</h3>
                <div className="price"><strong>$0</strong><span>forever</span></div>
                <ul><li><Check /> AI-exposure score</li><li><Check /> Durable-versus-exposed task map</li><li><Check /> Median salary context</li></ul>
              </article>
              <article className="price-card">
                <span className="price-for">How do I get there?</span>
                <h3>Pro</h3>
                <div className="price-toggle" role="group" aria-label="Pro billing frequency">
                  <span>Choose billing</span>
                  <div>
                    <button type="button" aria-pressed={proBilling === "monthly"} className={proBilling === "monthly" ? "active" : ""} onClick={() => setProBilling("monthly")}>Monthly</button>
                    <button type="button" aria-pressed={proBilling === "annual"} className={proBilling === "annual" ? "active" : ""} onClick={() => setProBilling("annual")}>Annual</button>
                  </div>
                </div>
                <div className="price"><strong>{proPlan.price}</strong><span>{proPlan.cadence}</span>{proPlan.savings && <em className="price-saving">{proPlan.savings}</em>}</div>
                <ul><li><Check /> Everything in Free</li><li><Check /> Resume reframes</li><li><Check /> Monthly re-runs</li></ul>
              </article>
              <article id="premium-checkout" className="price-card featured-price">
                {SHOW_DISCOUNTED_PRICING && <div className="price-ribbon">Limited Time prelaunch price</div>}
                <span className="price-for">Know my first move</span>
                <h3>Premium</h3>
                <div className="price-toggle premium-toggle" role="group" aria-label="Premium billing frequency">
                  <span>Choose billing</span>
                  <div>
                    <button type="button" aria-pressed={premiumBilling === "monthly"} className={premiumBilling === "monthly" ? "active" : ""} onClick={() => setPremiumBilling("monthly")}>Monthly</button>
                    <button type="button" aria-pressed={premiumBilling === "annual"} className={premiumBilling === "annual" ? "active" : ""} onClick={() => setPremiumBilling("annual")}>Annual</button>
                  </div>
                </div>
                {SHOW_DISCOUNTED_PRICING ? (
                  <div className="price"><s>{premiumPlan.regular} · 35% savings</s><strong>{premiumPlan.prelaunch}</strong><span>{premiumPlan.cadence}</span><em className="prelaunch-label">Limited Time prelaunch price</em><small className="limited-spots">Limited spots remain</small></div>
                ) : (
                  <div className="price"><strong>{premiumPlan.regular}</strong><span>{premiumPlan.cadence}</span>{premiumPlan.savings && <em className="price-saving">{premiumPlan.savings}</em>}</div>
                )}
                <ul><li><Check /> Everything in Pro</li><li><Check /> Living resume + LinkedIn system</li><li><Check /> Warm-path networking engine</li><li><Check /> Graduation-timeline roadmap</li></ul>
                {CHECKOUT_OPEN ? (
                  <a className="primary-cta full-cta" href={premiumPaymentLink || "#stripe-payment-link"} onClick={handlePremiumCheckout} target={premiumPaymentLink ? "_blank" : undefined} rel={premiumPaymentLink ? "noreferrer" : undefined}>Continue to secure checkout <ArrowRight /></a>
                ) : (
                  <button type="button" className="primary-cta full-cta" disabled>Checkout opens at launch</button>
                )}
                {CHECKOUT_OPEN && !premiumPaymentLink && (
                  // Build-time hint only. Both links are configured, so this does not
                  // render in production; it used to, telling buyers at the checkout
                  // button that checkout was not set up.
                  <div id="stripe-payment-link" className="checkout-note"><LockKeyhole /> Stripe Payment Link for Premium {premiumBilling} will open here when configured.</div>
                )}
              </article>
            </div>
          </div>
        </section>

        <section id="about" className="about-section">
          <div className="container about-grid">
            <div>
              <SectionLabel number="05">Why this exists</SectionLabel>
              <h2>A guide should be honest about what it knows.</h2>
              <article className="founder-card">
                <img src={ASSETS.founder} alt="Brooke Houck, PhD, founder of CairnCareers" width="300" height="300" loading="lazy" decoding="async" />
                <div><span className="slot-badge">Built by a PhD research scientist</span><h3><a href="https://www.linkedin.com/in/brookehouck" target="_blank" rel="noreferrer">Brooke Houck, PhD · Founder</a></h3><p>“Everyone has an opinion about AI. And a lot of people want to give you good advice. But work isn't the same anymore. Work has changed and is changing. Cairn Careers uses research standards you can read about openly. We give you data, not vibes, about what work looks like now and will look like 3 years from now.”</p></div>
              </article>
            </div>
          </div>
        </section>

        <section id="faq" className="paper-section faq-section">
          <div className="container">
            <SectionLabel number="06">FAQs</SectionLabel>
            <h2>Questions people actually ask.</h2>
            <div className="faq-list">
              {FAQS.map((item) => (
                <article className="faq-item" key={item.q}>
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="closing-section">
          <div className="container closing-inner">
            <span className="hero-eyebrow">The next marker is yours</span>
            <h2>Find my first move.</h2>
            <a className="primary-cta" href="#beta-access">Show me my career paths <ArrowRight /></a>
            <p>Launches October 31 · 30-day money-back guarantee: pre-launch from launch; after launch from purchase</p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand-block"><div className="wordmark footer-mark"><CairnMark /><span><strong>Cairn</strong><small>Careers</small></span></div><p>Career context for college students and recent graduates.</p><p className="footer-product-line">Cairn Careers is a product of <a href="https://phronesislabs.net" target="_blank" rel="noreferrer">Phronesis Labs, LLC</a>.</p></div>
          <div className="footer-links"><a href="mailto:contact@cairncareers.com">contact@cairncareers.com</a><span><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/refunds">Refunds</a> · <a href="/contact">Contact</a></span></div>
        </div>
      </footer>

      {showTopButton && (
        <button className="site-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top"><ArrowUp /></button>
      )}

      {showLeadModal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) dismissLead(); }}>
          <div className="lead-modal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">
            <button className="modal-close" onClick={dismissLead} aria-label="Close checklist offer"><X /></button>
            <span className="slot-badge">Launch notification</span>
            <h2 id="lead-modal-title">Want to know when Cairn Careers is live?</h2>
            <p>Leave your email and we will let you know when the product is ready to use.</p>
            <form className="email-form modal-form" onSubmit={submitLead}>
              <label htmlFor="modal-email">Email address</label>
              <div><Mail /><input id="modal-email" type="email" required placeholder="you@school.edu" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              <button type="submit" className="primary-cta" disabled={isLeadSubmitting}>{isLeadSubmitting ? "Saving…" : "Notify me at launch"} <ArrowRight /></button>
              <small>{leadCaptureEndpoint ? "Your email is saved to the launch-notification list." : "Preview mode: connect the database endpoint before collecting emails."}</small>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
