import LegalLayout from "./LegalLayout";

/**
 * The public methodology page.
 *
 * WHY THIS PAGE EXISTS
 * Every source behind the exposure score (O*NET, Eloundou et al., METR) was
 * cited only on the /dashboard-preview sample pages, and every one of those
 * pages is noindex. The evidence that makes the score credible was therefore
 * invisible to search engines and to answer engines, while the indexable
 * pages carried only the marketing claim. This page puts the sourcing on an
 * indexable URL, and the O*NET attribution the CC BY 4.0 license requires
 * now sits somewhere a reader can actually find it.
 */

/** Every claim about a source on this page carries its link, so a reader can
 * check the primary material rather than take our word for it. */
const SOURCES = {
  onetOnline: "https://www.onetonline.org/",
  onetCenter: "https://www.onetcenter.org/database.html",
  eloundouPreprint: "https://arxiv.org/abs/2303.10130",
  eloundouScience: "https://www.science.org/doi/10.1126/science.adj0998",
  metrPost: "https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/",
  metrPaper: "https://arxiv.org/abs/2503.14499",
  blsOoh: "https://www.bls.gov/ooh/",
  blsOes: "https://www.bls.gov/oes/",
  ccby: "https://creativecommons.org/licenses/by/4.0/",
};

const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
);

export default function Methodology() {
  return <LegalLayout
    eyebrow="How the numbers are built"
    title="Methodology"
    path="/methodology"
    documentTitle="How the AI-Exposure Score Is Calculated | CairnCareers"
    description="The data and research behind the CairnCareers AI-exposure score: O*NET occupational task data, the Eloundou et al. (2024) exposure framework in Science, and METR's long-run time-horizon trend, with every source linked."
    updated="August 31, 2026"
    updatedDateTime="2026-08-31"
    intro={<><strong>The exposure number is not our opinion.</strong> It is built from federal occupational task data and peer-reviewed research, and this page names every source, links it, and explains exactly what the number does and does not measure.</>}
    sections={[
      {
        title: "The three sources behind the score",
        body: <>
          <p>The AI-exposure score is built from three sources, and from nothing else.</p>
          <p>
            <strong>Occupational task data.</strong> The occupations and the specific task
            statements come from O*NET, the U.S. Department of Labor's occupational database.
            Browse it at <Ext href={SOURCES.onetOnline}>O*NET OnLine</Ext>, or read the
            database documentation at the <Ext href={SOURCES.onetCenter}>O*NET Resource Center</Ext>.
          </p>
          <p>
            <strong>The AI task-exposure framework.</strong> Each task's exposure to current AI
            comes from the peer-reviewed framework in "GPTs are GPTs." Read it free as
            a <Ext href={SOURCES.eloundouPreprint}>preprint on arXiv</Ext>, or see
            the <Ext href={SOURCES.eloundouScience}>published version in Science</Ext>.
            Full citation: Eloundou, T., Manning, S., Mishkin, P., and Rock, D. (2024).
            GPTs are GPTs: Labor market impact potential of LLMs.
            <em> Science</em>, 384(6702), 1306 to 1308.
          </p>
          <p>
            <strong>The AI capability trajectory.</strong> The outlook is anchored to METR's
            finding that the length of task an AI can complete with 50 percent reliability has
            been doubling roughly every seven months. See
            METR's <Ext href={SOURCES.metrPost}>write-up</Ext> and
            the <Ext href={SOURCES.metrPaper}>underlying paper</Ext>.
          </p>
        </>,
      },
      {
        title: "Matching a path to a real occupation",
        body: <>
          <p>We start by matching each career path you are considering to a standardized occupation, because AI does not replace job titles. It affects the specific tasks inside a job, and standardized occupations are how those tasks are defined.</p>
          <p>This matters more for a student than for someone already working. You are not rating a job you hold. You are comparing paths you might take, so each path has to resolve to a real occupation before its tasks can be scored at all.</p>
          <p>Throughout, you see the plain occupation name and how close the match is. The underlying federal occupation codes stay behind the scenes.</p>
        </>,
      },
      {
        title: "Weighting the work",
        body: <>
          <p>An occupation is a set of tasks, and those tasks do not carry equal weight. The score reflects the relative emphasis across the work, so the tasks that take up the most of a working week move the number the most.</p>
          <p>This is why two paths that sound similar can score very differently. The number follows the actual mix of work inside each occupation, not the job title on the outside.</p>
        </>,
      },
      {
        title: "Calculating the exposure score",
        body: <>
          <p>Every task carries an exposure value drawn from the framework in "GPTs are GPTs":</p>
          <ul>
            <li><strong>Minimal.</strong> Today's AI cannot meaningfully do the task. Exposure value 0.</li>
            <li><strong>Partial.</strong> AI can do it with the right software or tools. Exposure value 0.5.</li>
            <li><strong>Full.</strong> AI can already do it on its own. Exposure value 1.0.</li>
          </ul>
          <p>Each task's exposure value is weighted by how much of the work it accounts for. Those weighted values are averaged and placed on a 0 to 100 scale. In plain terms: multiply each task's exposure by its share of the work, add the results together, divide by the total, and scale to 100.</p>
          <p>A worked example. Say half of an occupation's work goes to a task AI can already do on its own, a quarter to a task AI can handle with the right tools, and the last quarter to a task AI cannot touch. That gives (0.5 x 1.0) + (0.25 x 0.5) + (0.25 x 0), which is 0.625, or about 63 on the 0 to 100 scale.</p>
        </>,
      },
      {
        title: "Why pay and growth never touch the score",
        body: <>
          <p>Salary, job growth, location, your network, and your portfolio are all shown beside the exposure number. None of them can move it by a single point. That separation is the reason the number means anything: if wages could raise or lower an exposure score, the score would no longer be telling you about AI at all.</p>
          <p>Pay and growth figures are shown as context, drawn from the U.S. Bureau of Labor Statistics: the <Ext href={SOURCES.blsOoh}>Occupational Outlook Handbook</Ext> for growth projections and <Ext href={SOURCES.blsOes}>Occupational Employment and Wage Statistics</Ext> for pay. They are display only, and by design they cannot shift the exposure figure.</p>
        </>,
      },
      {
        title: "The outlook, and why there is no single future number",
        body: <>
          <p>Alongside the current figure, we give a direction of travel: rising, steady, or already at the ceiling. It uses METR's established long-run time-horizon trend.</p>
          <p>We deliberately do not publish one percentage for a specific year in the future. Pinning down a single future figure would imply a precision nobody honestly has. The useful and truthful read is the trajectory, not a false decimal.</p>
          <p>We also use the established long-run trend rather than the faster 2026 estimates. Those newer figures come from a task suite near saturation, carry very wide confidence intervals, and measure software tasks specifically, as the title of the <Ext href={SOURCES.metrPaper}>METR paper</Ext> makes clear. Extrapolating them across all occupations is not justified, so we do not do it.</p>
        </>,
      },
      {
        title: "What this is, and what it is not",
        body: <>
          <p>This score measures task exposure, meaning what current AI can do. It is not a prediction that any particular job will disappear, and it is not a prediction about you.</p>
          <p>It is directional by design. It is built on today's models and the public research behind them, and it will move as both the models and the research move.</p>
          <p>It also cannot see the things that often matter most: your employer, your skill, your judgment, and the relationships you build. Treat it as an informed starting point for thinking about a career, not as career, financial, or legal advice.</p>
          <p>Producing it asks very little of you. No resume and no work history, just the paths you are weighing and the work you have already done. We collect only what is needed to generate your result. See the <a href="/privacy">Privacy Policy</a> for the details.</p>
        </>,
      },
      {
        title: "Sources and attribution",
        body: <>
          <ul>
            <li>Occupational and task data: <Ext href={SOURCES.onetOnline}>O*NET OnLine</Ext> and the <Ext href={SOURCES.onetCenter}>O*NET Resource Center</Ext>, U.S. Department of Labor.</li>
            <li>Task exposure framework: Eloundou et al. (2024), <Ext href={SOURCES.eloundouScience}>Science 384(6702), 1306 to 1308</Ext>, also available as an <Ext href={SOURCES.eloundouPreprint}>arXiv preprint</Ext>.</li>
            <li>Capability trajectory: <Ext href={SOURCES.metrPost}>METR</Ext> and its <Ext href={SOURCES.metrPaper}>paper on arXiv</Ext>.</li>
            <li>Pay and growth context: U.S. Bureau of Labor Statistics, <Ext href={SOURCES.blsOoh}>Occupational Outlook Handbook</Ext> and <Ext href={SOURCES.blsOes}>Occupational Employment and Wage Statistics</Ext>.</li>
          </ul>
          <p>This product includes information from the O*NET Database by the U.S. Department of Labor, Employment and Training Administration (USDOL/ETA). Used under the <Ext href={SOURCES.ccby}>CC BY 4.0 license</Ext>. O*NET is a trademark of USDOL/ETA. Phronesis Labs LLC has modified some of this information. USDOL/ETA has not approved, endorsed, or tested these modifications.</p>
        </>,
      },
      {
        title: "Questions about the method",
        body: <p>If something here is unclear, or you think we have a source wrong, tell us on the <a href="/contact">contact page</a>. Corrections to this page are welcome and we would rather fix an error than defend it.</p>,
      },
    ]}
  />;
}
