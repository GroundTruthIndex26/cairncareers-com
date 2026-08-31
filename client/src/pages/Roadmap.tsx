import { useEffect, useRef } from "react";
import Breadcrumbs, { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { usePageMeta } from "@/hooks/usePageMeta";
import "./Roadmap.css";

const BASE_URL = import.meta.env.BASE_URL;
const DASHBOARD = `${BASE_URL}dashboard-preview`;
const BREADCRUMB = [{ name: "Home", href: "/" }, { name: "Roadmap", href: "/roadmap" }];

const DASHBOARD_NAV = [
  { href: `${DASHBOARD}/evidence`, label: "Evidence" },
  { href: `${DASHBOARD}/portfolio`, label: "Portfolio" },
  { href: `${DASHBOARD}/resume`, label: "Resume" },
  { href: `${DASHBOARD}/linkedin`, label: "LinkedIn" },
  { href: `${DASHBOARD}/network`, label: "Network" },
  { href: `${DASHBOARD}/interview`, label: "Interview" },
  { href: `${DASHBOARD}/careers`, label: "Careers" },
  { href: "/roadmap", label: "Roadmap", current: true },
  { href: `${DASHBOARD}/cleanup`, label: "Clean-up" },
];

/**
 * HowTo structured data for the twelve-month sequence this page lays out.
 *
 * WHY THE STEPS ARE NAMED THE WAY THEY ARE
 * The month cards on this page carry invented specifics (a UX-research
 * student, a named course) because the page is an explicitly labelled
 * sample. Marking those specifics up as instructions would present invented
 * detail as advice, so each step is named for the move it demonstrates,
 * which is the part that generalises and the part the page is really
 * teaching. The name and description say plainly that it is an example.
 *
 * WHAT THIS IS AND IS NOT WORTH
 * Google removed HowTo rich results in 2023, so this earns no rich result
 * there. It is here because answer engines and non-Google consumers still
 * parse JSON-LD, and it is close to free to carry.
 */
const HOWTO_STEPS = [
  { name: "Close your largest evidence gap first", text: "Start with the single gap that the rest of the year builds on, so every later month has something to stand on. In the sample this is a research-methods course beginning in the first term." },
  { name: "Keep the foundational work running across the term", text: "Carry that first commitment through the full term rather than switching focus each month. The sample runs it from September through December." },
  { name: "Apply for the practical placement in the new term", text: "With the foundation underway, apply for the internship or placement that turns coursework into real evidence. The sample begins applications in January." },
  { name: "Work the search through to an offer", text: "Continue the search across the following weeks instead of treating it as a one-month task, and accept the offer when it lands. The sample accepts in April." },
  { name: "Show the work publicly before recruiting starts", text: "Present or publish something concrete ahead of recruiting season so there is evidence to point at. The sample presents at a design showcase in March." },
  { name: "Turn the placement into published case studies", text: "After the placement, convert what you did into case studies that a stranger can evaluate without you in the room. The sample publishes two across September and October." },
  { name: "Apply with the portfolio attached", text: "Send applications only once the portfolio is real, so each application carries evidence rather than claims. The sample applies in November." },
  { name: "Interview using answers you drafted earlier", text: "Go into interviews with answers already written against the evidence you built, rather than composing them under pressure. The sample interviews in December." },
];

/** HowTo structured data describing the sequence, generated from HOWTO_STEPS. */
function howToJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Example twelve-month roadmap from coursework to a first job",
    description:
      "An illustrative twelve-month sequence for a college student moving from coursework to a first job, with each month tied to a specific evidence gap and ordered so the earliest work makes the later work easier. Every name and figure in the worked example is invented for illustration.",
    totalTime: "P12M",
    step: HOWTO_STEPS.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      // No per-step url: these steps describe the sequence the page teaches
      // rather than mapping one-to-one onto anchored elements, and pointing
      // at #step-N anchors that do not exist would be a dangling reference.
    })),
  });
}

/**
 * The one dashboard-preview page promoted to a real, indexable route (per
 * the sitewide link to it from Home's sample-dashboard grid). Every other
 * sample page stays a plain static file under /dashboard-preview/. This is
 * the only one that needed its own title, canonical URL, and prerendering.
 */
export default function Roadmap() {
  usePageMeta({
    title: "Sample 12-Month Career Roadmap | CairnCareers Premium",
    description: "A sample twelve-month roadmap: each month tied to a specific evidence gap, sequenced so the earliest work makes the later work easier.",
  });

  const roadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const road = roadRef.current;
    if (!road || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            road.classList.add("go");
            io.unobserve(road);
          }
        });
      },
      { threshold: 0.5 },
    );
    io.observe(road);
    return () => io.disconnect();
  }, []);

  return (
    <div className="roadmap-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(BREADCRUMB) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: howToJsonLd() }} />
      <header className="hdr">
        <div className="hdr-in">
          <a className="brand" href="/" aria-label="CairnCareers home">
            <span className="mark"><img src={`${BASE_URL}brand/cairn-icon.svg`} width={36} height={36} alt="" aria-hidden="true" /></span>
            <span className="nm"><b>Cairn</b><span>Careers</span></span>
          </a>
          <nav aria-label="Dashboard sections">
            {DASHBOARD_NAV.map((item) => (
              <a key={item.href} href={item.href} className={item.current ? "on" : undefined}>{item.label}</a>
            ))}
          </nav>
          <div className="right">
            <a className="hdr-textlink" href={DASHBOARD}>Dashboard</a>
            <a className="chip" href="/#pricing">Preorder now</a>
          </div>
        </div>
      </header>

      <div className="wrap">
        <div className="stack">
          <div>
            <Breadcrumbs items={BREADCRUMB} className="rm-crumbs" />
            <h1 className="t">Twelve months, mapped so the biggest gaps close first.</h1>
            <p className="lede">This is not a list of good ideas. Each month is tied to a specific gap on your evidence page, sequenced so the earliest work makes the later work easier, with the breaks between terms doing real jobs of their own. Still in classes or already graduated, the sequence works the same.</p>
          </div>

          <div className="mockbar">Sample dashboard. Every name and number here is invented so you can see how it works.</div>

          <div className="sec">
            <div className="road" id="drive" ref={roadRef}>
              <span className="roadlabel">The drive to your first job, Sep 2026 to Dec 2027</span>
              <svg className="car" viewBox="0 0 240 92" aria-hidden="true">
                <g>
                  <path d="M12 58 Q12 50 22 47 L60 40 Q92 34 128 36 L176 40 Q210 43 224 52 Q230 56 229 62 Q228 68 218 68 L22 68 Q12 68 12 58 Z" fill="#e02424" stroke="#0b0b0b" strokeWidth="4" />
                  <rect x="96" y="29" width="48" height="9" fill="#0b0b0b" />
                  <path d="M148 38 L163 18 L171 22 L157 40 Z" fill="#cdeef2" stroke="#0b0b0b" strokeWidth="3" />
                  <circle cx="118" cy="21" r="8" fill="#0b0b0b" />
                  <rect x="222" y="52" width="7" height="7" fill="#ffc53d" stroke="#0b0b0b" strokeWidth="2" />
                  <rect x="12" y="52" width="6" height="8" fill="#ff3d8b" stroke="#0b0b0b" strokeWidth="2" />
                  <g className="wheel"><circle cx="58" cy="68" r="16" fill="#0b0b0b" /><circle cx="58" cy="68" r="8" fill="#8fa0a8" /><path d="M58 61 V75 M51 68 H65" stroke="#0b0b0b" strokeWidth="3" /></g>
                  <g className="wheel"><circle cx="188" cy="68" r="16" fill="#0b0b0b" /><circle cx="188" cy="68" r="8" fill="#8fa0a8" /><path d="M188 61 V75 M181 68 H195" stroke="#0b0b0b" strokeWidth="3" /></g>
                </g>
              </svg>
            </div>
          </div>

          <div className="sec">
            <div className="g g2">
              <div className="card" style={{ borderTop: "6px solid var(--rm-lime)" }}>
                <span className="eyebrow">Still in school</span>
                <p className="note" style={{ marginTop: 12 }}>The three blocks below map to your remaining terms, and the breaks are real breaks. Course picks like Research Methods slot into registration as it comes.</p>
              </div>
              <div className="card" style={{ borderTop: "6px solid var(--rm-cyan)" }}>
                <span className="eyebrow">Already graduated</span>
                <p className="note" style={{ marginTop: 12 }}>Same sequence, no syllabus required. Month one starts the day you decide, an online course or workshop stands in for the class pick, and the breaks become catch-up weeks.</p>
              </div>
            </div>
          </div>

          <div className="sec">
            <div className="termhead"><span className="dsp" style={{ fontSize: "2.2rem", color: "var(--rm-magenta)" }}>01</span><h2 className="t" style={{ margin: 0 }}>Fall term</h2><span className="mono-sub">Sep to Dec 2026</span><span className="pip lime">Now</span></div>
            <div className="g g4">
              <div className="card mon"><span className="eyebrow">Sep 2026</span><div style={{ marginTop: 12 }}>
                <div className="row"><span className="sq" /><div><div className="tt">Start Research Methods</div><div className="ss">Closes the framing gap, your largest. The rest of the year builds on it.</div></div></div>
                <div className="row"><span className="sq" /><div><div className="tt">Send the two messages waiting on the network page</div><div className="ss">Priya first, then the intro ask to Marcus.</div></div></div>
              </div></div>
              <div className="card mon"><span className="eyebrow">Oct 2026</span><div style={{ marginTop: 12 }}>
                <div className="row"><span className="sq" /><div><div className="tt">Research Methods, continued.</div><div className="ss">Stay for the unit on framing studies.</div></div></div>
                <div className="row"><span className="sq" /><div><div className="tt">Draft the onboarding case study</div><div className="ss">Backs a resume claim that has nothing behind it yet.</div></div></div>
              </div></div>
              <div className="card mon"><span className="eyebrow">Nov 2026</span><div style={{ marginTop: 12 }}>
                <div className="row"><span className="sq" /><div><div className="tt">Research Methods, continued.</div><div className="ss">Use the class project to practice owning a call.</div></div></div>
                <div className="row"><span className="sq" /><div><div className="tt">Case study, continued.</div><div className="ss">Full draft, then one round of feedback.</div></div></div>
              </div></div>
              <div className="card mon"><span className="eyebrow">Dec 2026</span><div style={{ marginTop: 12 }}>
                <div className="row"><span className="sq" /><div><div className="tt">Research Methods, continued.</div><div className="ss">The final project doubles as portfolio evidence.</div></div></div>
                <div className="row"><span className="sq" /><div><div className="tt">Ship the case study to the portfolio</div><div className="ss">Coverage moves when the prompt behind it is answered.</div></div></div>
              </div></div>
            </div>
          </div>

          <div className="sec"><div className="breakband"><span className="eyebrow">Winter break</span><p className="note" style={{ margin: "10px 0 0", maxWidth: "74ch" }}>Rest is allowed. The one thing that carries over: a cleaned-up portfolio link, ready for the January applications.</p></div></div>

          <div className="sec">
            <div className="termhead"><span className="dsp" style={{ fontSize: "2.2rem", color: "var(--rm-magenta)" }}>02</span><h2 className="t" style={{ margin: 0 }}>Spring term</h2><span className="mono-sub">Jan to Apr 2027</span><span className="pip cy">Build</span></div>
            <div className="g g4">
              <div className="card mon"><span className="eyebrow">Jan 2027</span><div style={{ marginTop: 12 }}>
                <div className="row"><span className="sq" /><div><div className="tt">Apply for the second UX research internship</div><div className="ss">Internship experience is the single biggest differentiator between two equal candidates.</div></div></div>
                <div className="row"><span className="sq" /><div><div className="tt">Pitch a talk for the design showcase</div><div className="ss">Answers the open presenting prompt.</div></div></div>
              </div></div>
              <div className="card mon"><span className="eyebrow">Feb 2027</span><div style={{ marginTop: 12 }}>
                <div className="row"><span className="sq" /><div><div className="tt">Internship search, continued.</div><div className="ss">Follow-ups and first-round interviews.</div></div></div>
                <div className="row"><span className="sq" /><div><div className="tt">Showcase prep, continued.</div><div className="ss">Practice in front of the critique night crowd.</div></div></div>
              </div></div>
              <div className="card mon"><span className="eyebrow">Mar 2027</span><div style={{ marginTop: 12 }}>
                <div className="row"><span className="sq" /><div><div className="tt">Present at the design showcase</div><div className="ss">Note the audience size; the evidence page will ask for it.</div></div></div>
                <div className="row"><span className="sq" /><div><div className="tt">Internship search, continued.</div><div className="ss">Final rounds, portfolio link in hand.</div></div></div>
              </div></div>
              <div className="card mon"><span className="eyebrow">Apr 2027</span><div style={{ marginTop: 12 }}>
                <div className="row"><span className="sq" /><div><div className="tt">Accept the internship offer</div><div className="ss">The summer plan locks in.</div></div></div>
                <div className="row"><span className="sq" /><div><div className="tt">Turn showcase contacts into two coffee chats</div><div className="ss">Loose ties are the ones that get people hired.</div></div></div>
              </div></div>
            </div>
          </div>

          <div className="sec"><div className="breakband" style={{ background: "var(--rm-lime)" }}><span className="eyebrow">Summer 2027</span><p className="note" style={{ margin: "10px 0 0", maxWidth: "74ch" }}>The second UX research internship, May to Aug. Twelve weeks of real sessions and real users, producing the numbers your senior-year applications lean on.</p></div></div>

          <div className="sec">
            <div className="termhead"><span className="dsp" style={{ fontSize: "2.2rem", color: "var(--rm-magenta)" }}>03</span><h2 className="t" style={{ margin: 0 }}>Fall term, senior year</h2><span className="mono-sub">Sep to Dec 2027</span><span className="pip mg">Recruiting</span></div>
            <div className="g g4">
              <div className="card mon"><span className="eyebrow">Sep 2027</span><div style={{ marginTop: 12 }}>
                <div className="row"><span className="sq" /><div><div className="tt">Publish case study one from the summer</div><div className="ss">Turns the portfolio into something you can send cold.</div></div></div>
                <div className="row"><span className="sq" /><div><div className="tt">Ask Priya and Marcus for referrals</div><div className="ss">The warm paths built a year ago pay off here.</div></div></div>
              </div></div>
              <div className="card mon"><span className="eyebrow">Oct 2027</span><div style={{ marginTop: 12 }}>
                <div className="row"><span className="sq" /><div><div className="tt">Publish case study two</div><div className="ss">Two published pieces beat one polished one.</div></div></div>
                <div className="row"><span className="sq" /><div><div className="tt">Referrals, continued.</div><div className="ss">Aim at coverage of 85 out of 100 for this role.</div></div></div>
              </div></div>
              <div className="card mon"><span className="eyebrow">Nov 2027</span><div style={{ marginTop: 12 }}>
                <div className="row"><span className="sq" /><div><div className="tt">Send applications with the portfolio attached</div><div className="ss">Every bullet traces back to an answered prompt.</div></div></div>
                <div className="row"><span className="sq" /><div><div className="tt">Referrals, continued.</div><div className="ss">Work the second-degree path into Verdi Labs.</div></div></div>
              </div></div>
              <div className="card mon"><span className="eyebrow">Dec 2027</span><div style={{ marginTop: 12 }}>
                <div className="row"><span className="sq" /><div><div className="tt">Interview, using the answer already drafted</div><div className="ss">The interview page keeps it current as evidence lands.</div></div></div>
                <div className="row"><span className="sq" /><div><div className="tt">Check coverage against the target of 85</div><div className="ss">Anything still open gets re-sequenced into spring.</div></div></div>
              </div></div>
            </div>
          </div>

          <div className="sec">
            <div className="card">
              <span className="eyebrow">Why it re-sequences</span>
              <h2 className="t" style={{ marginTop: 10 }}>The order changes when your evidence does</h2>
              <p className="note" style={{ marginTop: 10, maxWidth: "74ch" }}>Answer a prompt and a step can drop off. Change your target career and the whole sequence rebuilds around the new durable core. This is the reason the product is a subscription rather than a report: a plan written once for a junior is wrong by the following autumn.</p>
              <div className="btnrow">
                <a className="btn" href={`${DASHBOARD}/evidence#open`}>Update the evidence</a>
                <a className="btn ghost" href={`${DASHBOARD}/careers`}>Change the target career</a>
              </div>
            </div>
          </div>
        </div>

        <div className="sources" id="src">
          <h3>Method and sources</h3>
          <ol><li><a href="https://www.naceweb.org/">NACE, Job Outlook 2026</a></li></ol>
          <p style={{ margin: "14px 0 0" }}>The published AI-exposure number is built only from O*NET task data, Eloundou et al., and METR. Pay, growth, networking, portfolio, and clean-up are context and never move it. A 0–100 exposure scale.</p>
          <p style={{ margin: "14px 0 0" }}>This dashboard is a sample. Maya Rivera, Northlight University, Northbeam, Lumen, and Verdi Labs are invented, and every figure on this page is sample data, not a real result.</p>
        </div>
      </div>

      <footer className="foot">
        <div className="foot-in">
          <div>
            <a className="brand" href="/" style={{ color: "#ece7d8" }}>
              <span className="mark" style={{ borderColor: "#c7f94b" }}><img src={`${BASE_URL}brand/cairn-icon.svg`} width={36} height={36} alt="" aria-hidden="true" /></span>
              <span className="nm"><b style={{ color: "#fff" }}>Cairn</b><span>Careers</span></span>
            </a>
            <p className="tag">Career context for college students and recent graduates.</p>
            <p className="q">Questions? <a href="mailto:contact@cairncareers.com">contact@cairncareers.com</a></p>
            <p className="tag" style={{ margin: "10px 0 0" }}>CairnCareers is a product of <a href="https://phronesislabs.net" target="_blank" rel="noopener">Phronesis Labs LLC</a>.</p>
          </div>
          <div className="links">
            <a href="/#faq">FAQ</a>
            <a href="/#pricing">Pricing</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/refunds">Refunds</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
