import LegalLayout from "./LegalLayout";
import { rich, useI18n } from "@/lib/i18n";

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
 *
 * The text lives in lib/translations (one copy per language) as paragraphs
 * with [link](url) markup, so every claim about a source still carries its
 * link and a reader can check the primary material rather than take our word
 * for it. A paragraph that starts with "- " renders as a list.
 */
function Paragraph({ text }: { text: string }) {
  if (text.startsWith("- ")) {
    return (
      <ul>
        {text.split("\n").map((line) => <li key={line}>{rich(line.replace(/^- /, ""))}</li>)}
      </ul>
    );
  }
  return <p>{rich(text)}</p>;
}

export default function Methodology() {
  const { t } = useI18n();
  const m = t.methodology;
  return <LegalLayout
    eyebrow={m.eyebrow}
    title={m.title}
    path="/methodology"
    schemaType="Article"
    documentTitle={m.documentTitle}
    description={m.description}
    updated={m.updated}
    updatedDateTime="2026-08-31"
    intro={rich(m.intro)}
    sections={m.sections.map((section) => ({
      title: section.title,
      body: section.body.map((text) => <Paragraph key={text.slice(0, 40)} text={text} />),
    }))}
  />;
}
