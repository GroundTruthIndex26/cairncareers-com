import type { ReactNode } from "react";
import { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { PageFooter, PageHeader, PageHero } from "@/components/PageChrome";
import { usePageMeta } from "@/hooks/usePageMeta";

type LegalSection = {
  title: string;
  body: ReactNode;
};

type LegalLayoutProps = {
  eyebrow: string;
  title: string;
  path: string;
  documentTitle: string;
  description: string;
  updated: string;
  updatedDateTime: string;
  intro: ReactNode;
  sections: LegalSection[];
};

export default function LegalLayout({
  eyebrow,
  title,
  path,
  documentTitle,
  description,
  updated,
  updatedDateTime,
  intro,
  sections,
}: LegalLayoutProps) {
  usePageMeta({ title: documentTitle, description });
  const sectionId = (sectionTitle: string) => sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const breadcrumb = [{ name: "Home", href: "/" }, { name: title, href: path }];

  return (
    <div className="site-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(breadcrumb) }} />
      <PageHeader />
      <PageHero eyebrow={eyebrow} title={title} breadcrumb={breadcrumb}>
        <div className="legal-updated">
          <b>Last updated</b>
          <time dateTime={updatedDateTime}>{updated}</time>
        </div>
      </PageHero>

      <div className="container legal-body">
        <div className="legal-grid">
          <aside className="legal-toc" aria-label="Table of contents">
            <p>On this page</p>
            <nav>
              {sections.map((section) => (
                <a key={section.title} href={`#${sectionId(section.title)}`}>{section.title}</a>
              ))}
            </nav>
          </aside>
          <div>
            <div className="legal-intro">{intro}</div>
            {sections.map((section) => (
              <section id={sectionId(section.title)} key={section.title} className="legal-section">
                <h2>{section.title}</h2>
                {section.body}
              </section>
            ))}
          </div>
        </div>
      </div>

      <PageFooter />
    </div>
  );
}
