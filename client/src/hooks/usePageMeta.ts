import { useEffect } from "react";

type PageMeta = {
  title: string;
  description: string;
};

function setMetaContent(selector: string, value: string) {
  const el = document.querySelector<HTMLMetaElement>(selector);
  if (el) el.content = value;
}

/**
 * Sets the document title and description — and their Open Graph / Twitter
 * mirrors — for the page that calls it, restoring index.html's defaults on
 * unmount. index.html ships one static title/description for the whole app,
 * so without this every route (and every social share or AI crawler reading
 * it) saw the homepage's copy. Only the homepage relies on those defaults
 * directly; every other route calls this.
 */
export function usePageMeta({ title, description }: PageMeta) {
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = descriptionEl?.content;
    const previousOgTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content;
    const previousOgDescription = document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.content;
    const previousTwitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.content;
    const previousTwitterDescription = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.content;

    document.title = title;
    if (descriptionEl) descriptionEl.content = description;
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[name="twitter:title"]', title);
    setMetaContent('meta[name="twitter:description"]', description);

    return () => {
      document.title = previousTitle;
      if (descriptionEl && previousDescription !== undefined) descriptionEl.content = previousDescription;
      if (previousOgTitle !== undefined) setMetaContent('meta[property="og:title"]', previousOgTitle);
      if (previousOgDescription !== undefined) setMetaContent('meta[property="og:description"]', previousOgDescription);
      if (previousTwitterTitle !== undefined) setMetaContent('meta[name="twitter:title"]', previousTwitterTitle);
      if (previousTwitterDescription !== undefined) setMetaContent('meta[name="twitter:description"]', previousTwitterDescription);
    };
  }, [title, description]);
}
