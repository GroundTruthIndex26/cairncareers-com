import { ArrowRight } from "lucide-react";
import { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { PageFooter, PageHeader, PageHero } from "@/components/PageChrome";
import { usePageMeta } from "@/hooks/usePageMeta";
import { pageJsonLd } from "@/lib/pageJsonLd";

/**
 * The /vs comparison pages.
 *
 * WHY THESE PAGES EXIST
 * People searching "CairnCareers vs CareerWing" or "is ChatGPT good for career
 * advice" have already decided they want a tool and are choosing which one.
 * Nothing on the site answered that search; the one comparison we had was a
 * single FAQ answer about general chatbots.
 *
 * HOW THE CLAIMS ARE KEPT HONEST
 * Every statement about another product comes from that product's own public
 * pages, is dated in `checked`, and is linked in the footnotes. Where we could
 * not find something (a methodology page, a source list) the page says we did
 * not find it, not that it does not exist. Each page also says plainly when
 * the other product is the better choice. The pages are English only, like
 * the roadmap, because the search phrases they answer are English.
 *
 * Every number shown carries a numbered footnote with a source link (site rule).
 */

type Row = { label: string; theirs: string; ours: string };
type Note = { text: string; href: string };

type Comparison = {
  slug: string;
  name: string;
  shortName: string;
  documentTitle: string;
  description: string;
  /** One line for the related-comparisons block on the other /vs pages. */
  summary: string;
  eyebrow: string;
  title: string;
  intro: string;
  checked: string;
  rows: Row[];
  whenTheirs: { title: string; body: string[] };
  whenOurs: { title: string; body: string[] };
  notes: Note[];
};

const PRICING_NOTE: Note = { text: "CairnCareers pricing: Free, Pro at US$6 a month, Premium at US$11 a month, on the pricing section of the homepage.", href: "/#pricing" };
const METHOD_NOTE: Note = { text: "CairnCareers methodology page: the three sources behind the score (O*NET, Eloundou et al. 2024 in Science, METR) and the 0 to 100 scale.", href: "/methodology" };
const ROADMAP_NOTE: Note = { text: "CairnCareers sample roadmap: the term-by-term plan, one evidence gap per term.", href: "/roadmap" };

export const COMPARISONS: Comparison[] = [
  {
    slug: "chatgpt",
    name: "asking ChatGPT",
    shortName: "ChatGPT",
    documentTitle: "CairnCareers vs Asking ChatGPT About Your Career | CairnCareers",
    description: "What you get from asking ChatGPT which entry-level job holds up to AI, compared with CairnCareers: sourced federal task data versus training-data patterns.",
    summary: "Sourced federal task data and a term-by-term plan, compared with answers from a chatbot's training data.",
    eyebrow: "Comparison",
    title: "CairnCareers vs asking ChatGPT.",
    intro: "Most students try the chatbot first. It is free, it is fast, and it will happily tell you which jobs are safe from AI. The problem is that it cannot show you where any of that came from. This page sets out what each one gives you, and when the chatbot is the right tool.",
    checked: "September 21, 2026",
    rows: [
      { label: "Where the answer comes from", theirs: "Patterns in training data. The same question can get a different answer tomorrow, and there is no source to check.", ours: "Each career path is scored against O*NET, the U.S. Department of Labor's occupational task data, using the Eloundou et al. (2024) exposure framework published in Science and METR's capability trend.[1]" },
      { label: "Can you check the numbers", theirs: "No. A chatbot can name a study, but it cannot show that the number it gave you came from it.", ours: "Yes. Every source is named and linked on the methodology page, and every number on the dashboard carries a footnote.[1]" },
      { label: "Pay and growth data", theirs: "Mixed into the same answer as everything else, from whatever the model remembers.", ours: "From the U.S. Bureau of Labor Statistics, shown as context, and kept structurally separate from the exposure score so you can see what moved the result.[1]" },
      { label: "What happens when you have no number", theirs: "It will often write one for you, which is how invented figures end up on resumes.", ours: "The coach asks the one question that would produce the number, and if you do not have one it falls back to an honest description of scope. It never invents a figure." },
      { label: "The plan", theirs: "A list of suggestions in one reply, with no memory of what you did last term.", ours: "A term-by-term roadmap tied to the academic calendar, each term closing one evidence gap, plus resume, LinkedIn, network, and interview modules that share the same records.[3]" },
      { label: "Built for", theirs: "Everyone, for everything.", ours: "College students and recent graduates choosing a first path." },
      { label: "Price", theirs: "Free tier, with paid plans set by OpenAI.", ours: "Free tier. Pro at US$6 a month. Premium at US$11 a month.[2]" },
    ],
    whenTheirs: {
      title: "When ChatGPT is the better tool",
      body: [
        "Drafting a cover letter, rewording a bullet you already have a real number for, or rehearsing answers to interview questions out loud.",
        "Quick, low-stakes questions where you do not need to defend the answer to anyone.",
        "You can use both. Bring the sourced numbers from your dashboard to the chatbot and let it help you with the wording.",
      ],
    },
    whenOurs: {
      title: "When CairnCareers is the better tool",
      body: [
        "You are choosing between paths and want to know which tasks in each one are exposed to AI, with a source you can hand to an adviser, a parent, or a recruiter.",
        "You need a plan that survives past one chat window and moves the number over a year.",
        "You want the number on your resume to be one you can back up.",
      ],
    },
    notes: [METHOD_NOTE, PRICING_NOTE, ROADMAP_NOTE],
  },
  {
    slug: "careerwing",
    name: "CareerWing",
    shortName: "CareerWing",
    documentTitle: "CairnCareers vs CareerWing | CairnCareers",
    description: "CairnCareers vs CareerWing: a term-by-term roadmap for college students built on federal task data, versus a 30/90/365-day plan for working professionals.",
    summary: "A term-by-term roadmap for students built on linked sources, compared with CareerWing's 30/90/365-day plan and chat coach.",
    eyebrow: "Comparison",
    title: "CairnCareers vs CareerWing.",
    intro: "CareerWing and CairnCareers both hand you a plan. The difference is who the plan is for and what the clock is. CareerWing counts in days from today. CairnCareers counts in academic terms, because that is the calendar a student actually lives on.",
    checked: "September 21, 2026",
    rows: [
      { label: "Built for", theirs: "Professionals navigating uncertainty, discovering what is next, and staying accountable to a plan, according to its homepage.[4]", ours: "College students and recent graduates choosing a first path." },
      { label: "The plan", theirs: "A 30/90/365-day plan generated automatically once your matches are ready, with daily missions, XP, badges, and a Career Health Score.[4]", ours: "A term-by-term roadmap. Each term closes the biggest evidence gap first, sequenced so the earliest work makes the later work easier. See the sample roadmap.[3]" },
      { label: "The coach", theirs: "Ava, a chat coach available around the clock.[4]", ours: "A coach that asks one question at a time to turn what you did into a record with a number in it, and never writes the number for you." },
      { label: "Where the matches come from", theirs: "Your profile: strengths, motivations, work style, goals and constraints.[4] We did not find a public page naming outside data sources.", ours: "O*NET occupational task data, the Eloundou et al. (2024) exposure framework in Science, and METR's capability trend, every source linked on the methodology page.[1]" },
      { label: "AI exposure", theirs: "Described as helping you discover future-proof careers.[4] We did not find a published method for how that is measured.", ours: "A task-weighted 0 to 100 exposure score per path, with pay and growth data kept separate from it so you can see what moved the result.[1]" },
      { label: "One record, many outputs", theirs: "Missions and progress tracking.[4]", ours: "One answered prompt raises your coverage, writes a resume bullet, and writes a LinkedIn line at the same time." },
      { label: "Price", theirs: "See careerwing.ai for current plans.[4]", ours: "Free tier. Pro at US$6 a month. Premium at US$11 a month.[2]" },
    ],
    whenTheirs: {
      title: "When CareerWing is the better fit",
      body: [
        "You are already working and want to change roles on a day-counted timeline rather than a term-counted one.",
        "Daily missions, points, and a coach you can message at any hour are what keep you moving.",
      ],
    },
    whenOurs: {
      title: "When CairnCareers is the better fit",
      body: [
        "You are in school or just out, and your year runs on terms, not on days from today.",
        "You want to know where a number came from before you put it on a resume or repeat it to a recruiter.",
        "You want the AI-exposure score built from published, linkable sources rather than a profile match.",
      ],
    },
    notes: [METHOD_NOTE, PRICING_NOTE, ROADMAP_NOTE, { text: "CareerWing homepage: Ava, the 30/90/365-day plan, daily missions, XP, badges, and the Career Health Score, as described there on the date checked.", href: "https://careerwing.ai/" }],
  },
  {
    slug: "career-mirror",
    name: "Career Mirror",
    shortName: "Career Mirror",
    documentTitle: "CairnCareers vs Career Mirror | CairnCareers",
    description: "CairnCareers vs Career Mirror: an AI-exposure score built from sourced federal task data, versus a tool with no published methodology we could find.",
    summary: "An AI-exposure score with every source linked, compared with Career Mirror's career intelligence tool.",
    eyebrow: "Comparison",
    title: "CairnCareers vs Career Mirror.",
    intro: "Career Mirror describes itself as career intelligence for people who are growing, switching, or building. CairnCareers is narrower on purpose: students and recent graduates choosing a first path. The biggest difference is not the audience, though. It is whether you can see where the numbers came from.",
    checked: "September 21, 2026",
    rows: [
      { label: "Built for", theirs: "People who are growing, switching, or building, according to its homepage.[5]", ours: "College students and recent graduates choosing a first path." },
      { label: "What it does", theirs: "Helps you understand your skills, map your path, and navigate what comes next.[5]", ours: "Scores each path you are weighing for AI exposure, shows pay and growth as context, and hands you a term-by-term roadmap toward a first job.[3]" },
      { label: "Where the numbers come from", theirs: "We did not find a methodology page or a list of data sources on careermirror.ai on the date checked.[5]", ours: "O*NET occupational task data, the Eloundou et al. (2024) exposure framework in Science, and METR's capability trend. Every source is named and linked on the methodology page.[1]" },
      { label: "Can you check a number", theirs: "Not that we could find.", ours: "Yes. Every number on the dashboard carries a numbered footnote with a source link, and pay and growth data are kept separate from the exposure score.[1]" },
      { label: "The plan", theirs: "A mapped path.[5]", ours: "A term-by-term roadmap, each term closing one evidence gap, plus resume, LinkedIn, network, and interview modules built from the same records.[3]" },
      { label: "Invented numbers", theirs: "Not stated.", ours: "Never. The coach asks for the figure and shows where it belongs, and falls back to an honest scope description if you do not have one." },
      { label: "Price", theirs: "See careermirror.ai for current plans.[5]", ours: "Free tier. Pro at US$6 a month. Premium at US$11 a month.[2]" },
    ],
    whenTheirs: {
      title: "When Career Mirror is the better fit",
      body: [
        "You are mid-career, switching fields, or building something, and you want a broad read on your skills rather than a first-job plan.",
        "You do not need to show anyone the source behind the result.",
      ],
    },
    whenOurs: {
      title: "When CairnCareers is the better fit",
      body: [
        "You are a student or recent graduate and the plan needs to fit an academic calendar.",
        "You want an AI-exposure score you can defend, with every source one click away.",
        "You want the record you enter once to show up as a resume bullet, a LinkedIn line, and an interview answer.",
      ],
    },
    notes: [METHOD_NOTE, PRICING_NOTE, ROADMAP_NOTE, { text: "Career Mirror homepage, as described there on the date checked. No methodology or data-source page was found on the site on that date.", href: "https://app.careermirror.ai/" }],
  },
  {
    slug: "maketheleap",
    name: "Make the Leap",
    shortName: "Make the Leap",
    documentTitle: "CairnCareers vs Make the Leap | CairnCareers",
    description: "CairnCareers vs Make the Leap: a roadmap that updates each term, built on federal task data, versus one-time reports built on a founder's coaching frameworks.",
    summary: "A subscription roadmap that updates each term, compared with Make the Leap's one-time career reports.",
    eyebrow: "Comparison",
    title: "CairnCareers vs Make the Leap.",
    intro: "Make the Leap sells one-time reports. CairnCareers is a subscription that keeps your plan current. Both start free and neither needs a resume. The difference is what the result is built from, and what happens after you read it.",
    checked: "September 21, 2026",
    rows: [
      { label: "Built for", theirs: "Several assessments for different situations. First Leap is the one its FAQ describes as built for students, recent graduates, and anyone early in their career.[6]", ours: "College students and recent graduates choosing a first path." },
      { label: "Where the numbers come from", theirs: "AI configured around frameworks the founder developed through 9+ years of coaching and retreat facilitation, according to its FAQ.[6] We did not find an outside data source named there.", ours: "O*NET occupational task data, the Eloundou et al. (2024) exposure framework in Science, and METR's capability trend. Every source is named and linked on the methodology page.[1]" },
      { label: "AI exposure", theirs: "First Leap results include what its FAQ calls AI-proof scores.[6] We did not find a published method for how they are measured.", ours: "A task-weighted 0 to 100 exposure score per path, with pay and growth data kept separate from it so you can see what moved the result.[1]" },
      { label: "The plan", theirs: "A finished report, delivered as a PDF and on a web page. The Career Leap Roadmap adds a 90-day transition outline and a 4-week guided email program.[6]", ours: "A term-by-term roadmap that re-sequences as evidence gaps close or your target career changes, plus resume, LinkedIn, network, and interview modules built from the same records.[3]" },
      { label: "What happens next term", theirs: "The report is yours as written. A new read means a new assessment.", ours: "The roadmap updates. A plan written once for a junior is out of date by the following autumn, after new courses, an internship, or a change of mind." },
      { label: "How you start", theirs: "A free assessment of about 10 minutes.[6]", ours: "Leave an email for beta access. No resume or work history needed." },
      { label: "Price", theirs: "Free assessment, then one-time purchases: First Leap Blueprint at US$19, Career Brief at US$29, Career Leap Roadmap at US$79.[6]", ours: "Free tier. Pro at US$6 a month. Premium at US$11 a month.[2]" },
    ],
    whenTheirs: {
      title: "When Make the Leap is the better fit",
      body: [
        "You feel lost and want a one-time read on what is holding you back, more than a score for specific paths.",
        "You would rather pay once and own a finished report than subscribe.",
      ],
    },
    whenOurs: {
      title: "When CairnCareers is the better fit",
      body: [
        "You are weighing specific career paths and want an AI-exposure score you can trace to its sources.",
        "You want a plan that follows the academic calendar and changes as you do.",
        "You want the number on your resume to be one you can back up.",
      ],
    },
    notes: [METHOD_NOTE, PRICING_NOTE, ROADMAP_NOTE, { text: "Make the Leap FAQ: who First Leap is for, how results are generated, report contents and delivery, and prices, as described there on the date checked.", href: "https://www.maketheleap.co/faq" }],
  },
];

/**
 * Footnote numbers are stable across all four pages so the same fact always
 * has the same number: [1] methodology, [2] pricing, [3] roadmap, [4]
 * CareerWing, [5] Career Mirror, [6] Make the Leap. Each page lists only the notes it cites.
 */
const NOTE_NUMBER: Record<string, number> = { "/methodology": 1, "/#pricing": 2, "/roadmap": 3, "https://careerwing.ai/": 4, "https://app.careermirror.ai/": 5, "https://www.maketheleap.co/faq": 6 };

/** Turns "[1]" markers in a cell into superscript links to the footnotes. */
function withNotes(text: string) {
  const parts = text.split(/(\[\d\])/);
  return parts.map((part, index) => {
    const match = /^\[(\d)\]$/.exec(part);
    if (!match) return part;
    return <sup key={index}><a href={`#note-${match[1]}`} aria-label={`Source ${match[1]}`}>{match[1]}</a></sup>;
  });
}

export default function Compare({ slug }: { slug: string }) {
  const c = COMPARISONS.find((item) => item.slug === slug) ?? COMPARISONS[0];
  usePageMeta({ title: c.documentTitle, description: c.description });
  const path = `/vs/${c.slug}`;
  const breadcrumb = [{ name: "Home", href: "/" }, { name: "Compare", href: "/#compare" }, { name: `vs ${c.shortName}`, href: path }];
  const others = COMPARISONS.filter((item) => item.slug !== c.slug);

  return (
    <div className="site-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: pageJsonLd({ type: "Article", path, headline: c.title.replace(/\.$/, ""), description: c.description }) }} />
      <PageHeader />
      <PageHero eyebrow={c.eyebrow} title={c.title} breadcrumb={breadcrumb}>
        <p>{c.intro}</p>
        <div className="legal-updated"><b>Last checked</b><time dateTime="2026-09-21">{c.checked}</time></div>
      </PageHero>

      <div className="container vs-body">
        <table className="vs-table">
          <caption className="sr-only">Side by side: {c.name} and CairnCareers</caption>
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">Feature</span></th>
              <th scope="col">{c.shortName}</th>
              <th scope="col" className="vs-ours">CairnCareers</th>
            </tr>
          </thead>
          <tbody>
            {c.rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td data-col={c.shortName}>{withNotes(row.theirs)}</td>
                <td className="vs-ours" data-col="CairnCareers">{withNotes(row.ours)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="vs-when">
          <section className="vs-when-card">
            <h2>{c.whenTheirs.title}</h2>
            <ul>{c.whenTheirs.body.map((line) => <li key={line}>{line}</li>)}</ul>
          </section>
          <section className="vs-when-card vs-when-ours">
            <h2>{c.whenOurs.title}</h2>
            <ul>{c.whenOurs.body.map((line) => <li key={line}>{line}</li>)}</ul>
          </section>
        </div>

        <div className="vs-cta">
          <a className="primary-cta" href="/#beta-access">Request beta access <ArrowRight /></a>
          <a className="secondary-cta vs-secondary" href="/#dashboard-preview">See a sample dashboard first <ArrowRight /></a>
        </div>

        <section className="vs-notes" aria-label="Sources">
          <h2>Sources</h2>
          <ol>
            {c.notes.map((note) => (
              <li key={note.href} id={`note-${NOTE_NUMBER[note.href]}`} value={NOTE_NUMBER[note.href]}>
                <a href={note.href} target={/^https?:/.test(note.href) ? "_blank" : undefined} rel={/^https?:/.test(note.href) ? "noopener noreferrer" : undefined}>{note.text}</a>
              </li>
            ))}
          </ol>
          <p>Statements about {c.name === "asking ChatGPT" ? "ChatGPT" : c.shortName} describe its public pages on the date checked and may have changed since. If something here is out of date, <a href="/contact">tell us</a> and we will correct it.</p>
        </section>

        {/* Related reading, chosen by cluster: the other three comparisons plus
            the methodology every comparison cites. Each link carries a line of
            context so it reads as a recommendation, not a bare listing. */}
        <section className="vs-related" aria-labelledby="vs-related-title">
          <h2 id="vs-related-title">Related comparisons</h2>
          <ul>
            {others.map((item) => (
              <li key={item.slug}>
                <a href={`/vs/${item.slug}`}>CairnCareers vs {item.shortName}</a>
                <p>{item.summary}</p>
              </li>
            ))}
            <li>
              <a href="/methodology">How the AI-exposure score is calculated</a>
              <p>The three sources behind the AI-exposure score this page cites, each one linked.</p>
            </li>
          </ul>
        </section>
      </div>

      <PageFooter />
    </div>
  );
}
