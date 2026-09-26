const ORIGIN = "https://cairncareers.com";

type PageType = "Article" | "WebPage" | "ContactPage";

type PageJsonLd = {
  type: PageType;
  path: string;
  headline: string;
  description: string;
};

/**
 * Page-level structured data: what this page is, who wrote it, and when.
 *
 * index.html carries the sitewide graph (Organization, WebSite, the app, the
 * founder). This adds the page itself, pointing back into that graph by @id,
 * so a crawler can tell an article (the methodology, the /vs pages) from a
 * contact page or a policy. The dates come from git history at build time
 * (scripts/routes.mjs), the same dates as the sitemap, so they move only when
 * the page's source actually changes.
 */
export function pageJsonLd({ type, path, headline, description }: PageJsonLd) {
  const url = path === "/" ? `${ORIGIN}/` : `${ORIGIN}${path}`;
  const dates = __PAGE_DATES__[path];
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#page`,
    url,
    headline,
    name: headline,
    description,
    inLanguage: "en-US",
    isPartOf: { "@id": `${ORIGIN}/#website` },
    author: { "@type": "Person", "@id": `${ORIGIN}/#founder`, name: "Brooke Houck" },
    publisher: { "@type": "Organization", "@id": `${ORIGIN}/#organization`, name: "CairnCareers" },
    ...(dates ? { datePublished: dates.published, dateModified: dates.modified } : {}),
  });
}
