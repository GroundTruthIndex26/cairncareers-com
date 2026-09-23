/**
 * English copy for the landing page, the shared header and footer, and the
 * methodology page. This is the reference: es.ts and fr.ts must have the
 * same shape (TypeScript checks it), so a string added here has to be added
 * in both translations before the build passes.
 *
 * Strings may carry [text](href), **strong** and *em*; see rich() in i18n.tsx.
 * A methodology paragraph that starts with "- " is a list, one item per line.
 */
export const en = {
  meta: {
    homeTitle: "Find an Entry-Level Path That Holds Up to AI | CairnCareers",
    homeDescription: "Compare realistic career paths using salary, job growth, and AI context, then leave with a next move you can explain.",
  },
  languageSwitch: "Language",
  bar: {
    launch: "Launch Oct. 31",
    beta: "Free for beta users through October 31, 2027",
    guarantee: "30-day money-back guarantee",
  },
  nav: {
    how: "How it works",
    dashboard: "Sample Dashboard",
    roadmap: "Roadmap",
    pricing: "Pricing",
    about: "About",
    faq: "FAQ",
    methodology: "Methodology",
    cta: "Show me my career paths",
    home: "CairnCareers home",
    toggle: "Toggle navigation",
    primary: "Primary navigation",
    mobile: "Mobile navigation",
  },
  hero: {
    title: "Find an entry-level path that holds up to AI.",
    campaigns: {
      default: {
        eyebrow: "For college students and recent graduates",
        body: "Compare realistic career paths using salary, job growth, and AI context, then leave with a next move you can explain.",
      },
      campus: {
        eyebrow: "From campus to a first role that fits",
        body: "Turn your coursework, experiences, and interests into a career route you can discuss with an adviser, professor, or recruiter.",
      },
      social: {
        eyebrow: "Worried AI changes your first-job options?",
        body: "See which tasks are exposed, which skills stay durable, and what to do next, without asking a general chatbot to guess.",
      },
    },
    launches: "Launches Oct. 31",
    guarantee: "30-day money-back guarantee",
    visualLabel: "Career route from self-knowledge to an evidence-supported next move",
    imageAlt: "Abstract route map with three career-planning waypoints",
    routeKicker: "A steadier way forward",
    routeTitle: "Three signals. One next move.",
    secondaryCta: "See a sample dashboard first",
    routeSteps: ["What you know", "Market context", "A route to test"],
  },
  trust: {
    label: "Trust and risk reversal",
    guarantee: "30-day money-back guarantee",
    guaranteeDetail: "· pre-launch: from launch · after launch: from purchase",
    secure: "Secure checkout",
    secureDetail: "handled by Stripe",
    sources: "Every score is sourced",
    sourcesDetail: "O*NET, Science, and METR, each linked on the [methodology page](/methodology)",
  },
  route: {
    label: "The route",
    noResume: "No resume or work history needed. Bring your interests, coursework, and what you have done so far.",
    title: "Career planning that ends with a first move.",
    lead: "If you have been stuck for months and still do not have a concrete career plan, your map should make the next decision smaller, more specific, and easier to test in the real world.",
    steps: [
      ["Bring what you know", "Your interests, coursework, experience, and the work that holds your attention."],
      ["Read the whole picture", "Salary, job growth, and AI exposure in one place, not isolated numbers."],
      ["Leave with a route", "A practical LinkedIn, networking, and first-conversation direction."],
    ],
  },
  dashboard: {
    label: "Sample Dashboard",
    titleLine1: "Meet Maya.",
    titleLine2: "See Maya's sample dashboard.",
    frameLabel: "Illustrative Sample Dashboard preview",
    kicker: "Premium dashboard",
    stand: "Where you stand, Maya.",
    sample: "Sample data",
    coverage: "Coverage",
    coverageSub: "of 100 · up 12 this term",
    ai: "What AI already does",
    aiSub: "Moderate exposure",
    readiness: "Readiness",
    readinessSub: "One private clean-up flag",
    modulesLabel: "Sample Dashboard pages",
    open: "Open",
    areas: [
      { title: "Evidence", body: "Turn real work into proof that strengthens a resume bullet, LinkedIn line, and interview answer." },
      { title: "Portfolio", body: "Keep the work itself beside the claim it supports: case studies, reports, prototypes, and decks." },
      { title: "Resume", body: "See how one update can carry through a clean, standard resume built from real evidence." },
      { title: "LinkedIn", body: "Preview copyable profile blocks without scraping, password requests, or opaque automation." },
      { title: "Network", body: "Follow warm paths and use the exact message that makes a first outreach easier to send." },
      { title: "Interview", body: "Practice clear standard and role-specific answers grounded in evidence you can explain." },
      { title: "Careers", body: "Compare pay, growth, work location, and AI context without pretending money changes the score." },
      { title: "Roadmap", body: "See a term-by-term route that closes the biggest evidence gaps first." },
      { title: "Clean-up", body: "Understand the privacy-first path for sensitive context that should never be described to a model." },
    ],
  },
  beta: {
    eyebrow: "Beta access",
    title: "Sign up for the beta and use CairnCareers free for a year after launch.",
    lead: "Leave your email and we will set up your account.",
    emailLabel: "Email address",
    placeholder: "you@email.com",
    submit: "Request beta access",
    saving: "Saving…",
    confirmation: "We are still building, but can't wait for you to use CairnCareers. You will receive an email when your account is fully activated.",
    error: "We could not save your request. Please try again.",
    counter: "{count} beta testers signed up so far",
    counterNote: "Live count of beta requests sent through this form. How we handle your email is in the [Privacy Policy](/privacy).",
  },
  pricing: {
    label: "Pricing",
    title: "Simple pricing.",
    chooseBilling: "Choose billing",
    monthly: "Monthly",
    annual: "Annual",
    perMonth: "/ month",
    perYear: "/ year",
    savings: "35% savings",
    proGroup: "Pro billing frequency",
    premiumGroup: "Premium billing frequency",
    free: { for: "Where do I stand?", name: "Free", price: "$0", cadence: "forever", features: ["AI-exposure score", "Durable-versus-exposed task map", "Median salary context"] },
    pro: { for: "How do I get there?", name: "Pro", features: ["Everything in Free", "Resume reframes", "Monthly re-runs"] },
    premium: { for: "Know my first move", name: "Premium", features: ["Everything in Pro", "Living resume + LinkedIn system", "Warm-path networking engine", "Graduation-timeline roadmap"] },
    ribbon: "Limited Time prelaunch price",
    prelaunchLabel: "Limited Time prelaunch price",
    limitedSpots: "Limited spots remain",
    checkout: "Continue to secure checkout",
    checkoutClosed: "Checkout opens at launch",
    ticker: "Beta users get a free year after launch!",
    groupNote: "Group pricing and enterprise pricing are available - contact for more information:",
    approx: "Prices marked ≈ are shown in {currency} for reference. You are charged in US dollars.",
    whySubscription: "**Why a subscription, not a one-time report?** Your roadmap re-sequences as evidence gaps close or your target career changes. A plan written once is wrong by next autumn. [See how the roadmap works](/roadmap).",
  },
  about: {
    label: "Why this exists",
    title: "A guide should be honest about what it knows.",
    badge: "Built by a PhD research scientist",
    founder: "Brooke Houck, PhD · Founder",
    imageAlt: "Brooke Houck, PhD, founder of CairnCareers",
    quote: "“I built CairnCareers because I kept getting annoyed. Every week there was a new headline about which jobs AI would wipe out, and almost none of them said how they knew. When I traced the claims back, most rested on a job title and a guess. In my field you do not get to publish a number without showing where it came from. Students are making one of the most expensive decisions of their lives on claims that would not survive peer review, and they deserve the standard I am held to.”",
  },
  testimonials: {
    label: "Beta testers",
    title: "What beta testers are saying.",
  },
  faq: {
    label: "FAQs",
    title: "Questions people actually ask.",
    items: [
      {
        q: "What is Cairn Careers?",
        a: "Cairn Careers is a career-planning tool for college students and recent graduates. It turns your interests, coursework, and experience into an AI-exposure score for each career path you are weighing, alongside a sequenced plan toward a first job. It is a product of Phronesis Labs LLC and is not affiliated with Cairn University or Cairn Group.",
      },
      {
        q: "How is the AI-exposure score calculated?",
        a: "Each task in an occupation is weighted by how much of the work it accounts for, multiplied by that task's AI-exposure value, and the result is placed on a 0 to 100 scale. Task data comes from O*NET, exposure values from Eloundou et al. (2024) in Science, and the outlook from METR's long-run time-horizon trend. The full calculation is set out on the [methodology page](/methodology).",
      },
      {
        q: "Does the score predict whether I will lose my job?",
        a: "No. The score measures task exposure, meaning what current AI can already do, not whether a particular job will disappear. It cannot see your employer, your skill, your judgment, or the relationships you build, and it is not career, financial, or legal advice.",
      },
      {
        q: "Which entry-level jobs are most exposed to AI?",
        a: "Exposure follows the mix of tasks inside a job rather than the job title, so two roles that sound similar can score very differently. Work that is mostly drafting, summarizing, routine analysis, or standardized documentation tends to score higher, while work that turns on physical presence, negotiation, or accountability for a judgment call tends to score lower. Cairn Careers scores the specific paths you are weighing rather than publishing one general ranking.",
      },
      {
        q: "Do I need a resume or work history to use it?",
        a: "No. You bring your interests, your coursework, and the experience you already have, including class projects and part-time work. There is no resume upload and no work-history requirement.",
      },
      {
        q: "How is this different from asking a general AI chatbot about my career?",
        a: "A general chatbot produces an answer from patterns in its training data and cannot show you where a number came from. Cairn Careers scores your paths against federal occupational task data and published research, names and links every source on its [methodology page](/methodology), and keeps pay and growth data structurally separate from the exposure score so you can see exactly what moved the result.",
      },
      {
        q: "Where does Cairn Careers get its data?",
        a: "Occupational task data comes from O*NET, the U.S. Department of Labor's occupational database. AI task exposure comes from Eloundou et al. (2024) in Science. The capability trajectory comes from METR. Pay and growth figures come from the U.S. Bureau of Labor Statistics and are shown as context only, and they never enter the exposure score. Every source is linked on the [methodology page](/methodology).",
      },
      {
        q: "Who is Cairn Careers for?",
        a: "College students and recent graduates deciding what to aim for and what to do next. It is most useful if you are choosing between several paths, or have already chosen one and want a month-by-month plan toward a first job. You can see that plan in the [sample roadmap](/roadmap).",
      },
      {
        q: "What does Cairn Careers cost?",
        a: "Premium is $11 a month or $86 a year. Pro is $6 a month or $46 a year. We launch on October 31, 2026. Anyone who signs up for the beta before then uses Cairn Careers free through October 31, 2027, one year after launch. Every purchase is covered by a 30-day money-back guarantee, described on the [refund policy page](/refunds).",
      },
    ],
  },
  closing: {
    eyebrow: "The next marker is yours",
    title: "Find my first move.",
    line: "Launches October 31 · 30-day money-back guarantee",
  },
  footer: {
    tagline: "Career context for college students and recent graduates.",
    productLine: "Cairn Careers is a product of [Phronesis Labs, LLC](https://phronesislabs.net).",
    privacy: "Privacy",
    terms: "Terms",
    refunds: "Refunds",
    contact: "Contact",
    methodology: "Methodology",
    compare: "Compare:",
  },
  compare: {
    label: "Compared with a chatbot",
    title: "How this compares to asking ChatGPT.",
    lead: "Most students try the chatbot first. Here is what each one gives you.",
    chatbot: { title: "Asking ChatGPT", points: ["Answers from patterns in its training data.", "Cannot show you where a number came from.", "Pay, growth, and AI risk mixed into one reply.", "Will often write a number for you when you do not have one."] },
    cairn: { title: "CairnCareers", points: ["Scores each path against federal occupational task data.", "Names and links every source on the methodology page.", "Keeps pay and growth separate from the exposure score, so you can see what moved the result.", "Never invents a number. It asks the question that produces one."] },
    methodLink: "Read the methodology",
    fullLink: "See the full comparison",
  },
  modal: {
    badge: "Launch notification",
    title: "Want to know when Cairn Careers is live?",
    lead: "Leave your email and we will let you know when the product is ready to use.",
    emailLabel: "Email address",
    submit: "Notify me at launch",
    saving: "Saving…",
    close: "Close checklist offer",
    successTitle: "You are on the launch-notification list.",
    successBody: "We will use this email to let you know when CairnCareers is live.",
    errorTitle: "We could not save your email address",
    errorBody: "Please try again in a moment.",
  },
  legal: {
    home: "Home",
    updated: "Last updated",
    onThisPage: "On this page",
    toc: "Table of contents",
    breadcrumb: "Breadcrumb",
    backToTop: "Back to top",
  },
  methodology: {
    eyebrow: "How the numbers are built",
    title: "Methodology",
    documentTitle: "How the AI-Exposure Score Is Calculated | CairnCareers",
    description: "How the CairnCareers AI-exposure score is built: O*NET task data, the Eloundou et al. (2024) framework in Science, and METR's trend, every source linked.",
    updated: "August 31, 2026",
    intro: "**The exposure number is not our opinion.** It is built from federal occupational task data and peer-reviewed research, and this page names every source, links it, and explains exactly what the number does and does not measure.",
    sections: [
      {
        title: "The three sources behind the score",
        body: [
          "The AI-exposure score is built from three sources, and from nothing else.",
          "**Occupational task data.** The occupations and the specific task statements come from O*NET, the U.S. Department of Labor's occupational database. Browse it at [O*NET OnLine](https://www.onetonline.org/), or read the database documentation at the [O*NET Resource Center](https://www.onetcenter.org/database.html).",
          "**The AI task-exposure framework.** Each task's exposure to current AI comes from the peer-reviewed framework in \"GPTs are GPTs.\" Read it free as a [preprint on arXiv](https://arxiv.org/abs/2303.10130), or see the [published version in Science](https://www.science.org/doi/10.1126/science.adj0998). Full citation: Eloundou, T., Manning, S., Mishkin, P., and Rock, D. (2024). GPTs are GPTs: Labor market impact potential of LLMs. *Science*, 384(6702), 1306 to 1308.",
          "**The AI capability trajectory.** The outlook is anchored to METR's finding that the length of task an AI can complete with 50 percent reliability has been doubling roughly every seven months. See METR's [write-up](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) and the [underlying paper](https://arxiv.org/abs/2503.14499).",
        ],
      },
      {
        title: "Matching a path to a real occupation",
        body: [
          "We start by matching each career path you are considering to a standardized occupation, because AI does not replace job titles. It affects the specific tasks inside a job, and standardized occupations are how those tasks are defined.",
          "This matters more for a student than for someone already working. You are not rating a job you hold. You are comparing paths you might take, so each path has to resolve to a real occupation before its tasks can be scored at all.",
          "Throughout, you see the plain occupation name and how close the match is. The underlying federal occupation codes stay behind the scenes.",
        ],
      },
      {
        title: "Weighting the work",
        body: [
          "An occupation is a set of tasks, and those tasks do not carry equal weight. The score reflects the relative emphasis across the work, so the tasks that take up the most of a working week move the number the most.",
          "This is why two paths that sound similar can score very differently. The number follows the actual mix of work inside each occupation, not the job title on the outside.",
        ],
      },
      {
        title: "Calculating the exposure score",
        body: [
          "Every task carries an exposure value drawn from the framework in \"GPTs are GPTs\":",
          "- **Minimal.** Today's AI cannot meaningfully do the task. Exposure value 0.\n- **Partial.** AI can do it with the right software or tools. Exposure value 0.5.\n- **Full.** AI can already do it on its own. Exposure value 1.0.",
          "Each task's exposure value is weighted by how much of the work it accounts for. Those weighted values are averaged and placed on a 0 to 100 scale. In plain terms: multiply each task's exposure by its share of the work, add the results together, divide by the total, and scale to 100.",
          "A worked example. Say half of an occupation's work goes to a task AI can already do on its own, a quarter to a task AI can handle with the right tools, and the last quarter to a task AI cannot touch. That gives (0.5 x 1.0) + (0.25 x 0.5) + (0.25 x 0), which is 0.625, or about 63 on the 0 to 100 scale.",
        ],
      },
      {
        title: "Why pay and growth never touch the score",
        body: [
          "Salary, job growth, location, your network, and your portfolio are all shown beside the exposure number. None of them can move it by a single point. That separation is the reason the number means anything: if wages could raise or lower an exposure score, the score would no longer be telling you about AI at all.",
          "Pay and growth figures are shown as context, drawn from the U.S. Bureau of Labor Statistics: the [Occupational Outlook Handbook](https://www.bls.gov/ooh/) for growth projections and [Occupational Employment and Wage Statistics](https://www.bls.gov/oes/) for pay. They are display only, and by design they cannot shift the exposure figure.",
        ],
      },
      {
        title: "The outlook, and why there is no single future number",
        body: [
          "Alongside the current figure, we give a direction of travel: rising, steady, or already at the ceiling. It uses METR's established long-run time-horizon trend.",
          "We deliberately do not publish one percentage for a specific year in the future. Pinning down a single future figure would imply a precision nobody honestly has. The useful and truthful read is the trajectory, not a false decimal.",
          "We also use the established long-run trend rather than the faster 2026 estimates. Those newer figures come from a task suite near saturation, carry very wide confidence intervals, and measure software tasks specifically, as the title of the [METR paper](https://arxiv.org/abs/2503.14499) makes clear. Extrapolating them across all occupations is not justified, so we do not do it.",
        ],
      },
      {
        title: "What this is, and what it is not",
        body: [
          "This score measures task exposure, meaning what current AI can do. It is not a prediction that any particular job will disappear, and it is not a prediction about you.",
          "It is directional by design. It is built on today's models and the public research behind them, and it will move as both the models and the research move.",
          "It also cannot see the things that often matter most: your employer, your skill, your judgment, and the relationships you build. Treat it as an informed starting point for thinking about a career, not as career, financial, or legal advice.",
          "Producing it asks very little of you. No resume and no work history, just the paths you are weighing and the work you have already done. We collect only what is needed to generate your result. See the [Privacy Policy](/privacy) for the details.",
        ],
      },
      {
        title: "Sources and attribution",
        body: [
          "- Occupational and task data: [O*NET OnLine](https://www.onetonline.org/) and the [O*NET Resource Center](https://www.onetcenter.org/database.html), U.S. Department of Labor.\n- Task exposure framework: Eloundou et al. (2024), [Science 384(6702), 1306 to 1308](https://www.science.org/doi/10.1126/science.adj0998), also available as an [arXiv preprint](https://arxiv.org/abs/2303.10130).\n- Capability trajectory: [METR](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) and its [paper on arXiv](https://arxiv.org/abs/2503.14499).\n- Pay and growth context: U.S. Bureau of Labor Statistics, [Occupational Outlook Handbook](https://www.bls.gov/ooh/) and [Occupational Employment and Wage Statistics](https://www.bls.gov/oes/).",
          "This product includes information from the O*NET Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the [CC BY 4.0 license](https://creativecommons.org/licenses/by/4.0/). O*NET is a trademark of USDOL/ETA. Phronesis Labs LLC has modified some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.",
        ],
      },
      {
        title: "Questions about the method",
        body: [
          "If something here is unclear, or you think we have a source wrong, tell us on the [contact page](/contact). Corrections to this page are welcome and we would rather fix an error than defend it.",
        ],
      },
    ],
  },
};
