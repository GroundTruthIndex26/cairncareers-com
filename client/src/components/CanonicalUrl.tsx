import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Keeps the canonical URL pointing at the page you are actually on.
 *
 * index.html ships one static canonical for the whole app, so every route
 * was telling Google it was a duplicate of the home page. A self-referencing
 * canonical fixes that.
 */
const ORIGIN = "https://cairncareers.com";

export default function CanonicalUrl() {
  const [location] = useLocation();

  useEffect(() => {
    const path = location === "/" ? "/" : location.replace(/\/+$/, "");
    const href = `${ORIGIN}${path}`;

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = href;

    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = href;
  }, [location]);

  return null;
}
