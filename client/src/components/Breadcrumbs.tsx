const ORIGIN = "https://cairncareers.com";

export type Crumb = { name: string; href?: string };

/** BreadcrumbList structured data for the given trail. */
export function breadcrumbJsonLd(items: Crumb[]) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: `${ORIGIN}${item.href}` } : {}),
    })),
  });
}

/**
 * Visible breadcrumb trail, paired with breadcrumbJsonLd for the same items.
 * Rendered on every secondary page so both users and crawlers see how a page
 * sits in the site, not just the JSON-LD a person never sees.
 */
export default function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className ? `breadcrumb-nav ${className}` : "breadcrumb-nav"}>
      {items.map((item, index) => (
        <span key={item.name} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {index > 0 && <span aria-hidden="true">/</span>}
          {item.href ? <a href={item.href}>{item.name}</a> : <span aria-current="page">{item.name}</span>}
        </span>
      ))}
    </nav>
  );
}
