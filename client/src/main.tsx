import { createRoot, hydrateRoot } from "react-dom/client";
import App, { loadPage } from "./App";
import "./index.css";
import "./hero-unfurl.css";
import { I18nProvider, initialLang, loadStrings } from "./lib/i18n";
import { scheduleAnalytics } from "./lib/analytics";
import { markTextBoundariesForPrerender } from "./lib/textBoundaries";

// Analytics loads after first paint; see lib/analytics.ts for why.
scheduleAnalytics();

// Wait for this page's code and this visitor's language before the first
// render. Until then the prerendered HTML stays on screen untouched.
//
// hydrateRoot adopts the prerendered DOM instead of replacing it, so the page
// a visitor already sees is not painted a second time once the script runs.
// (A full re-render put the mobile LCP at 3.3 s: the repaint, not the first
// paint, was what got measured.) The prerendered HTML is English, so a visitor
// reading another language gets a plain render that replaces it, as every
// visit did before; so does an empty #root (the dev server, and the prerender
// crawl itself). If hydration still finds a mismatch, React logs it and falls
// back to the same full client render.
const root = document.getElementById("root")!;
const lang = initialLang();
Promise.all([loadPage(window.location.pathname), loadStrings(lang)]).then(([Page]) => {
  const app = (
    <I18nProvider>
      <App Page={Page} />
    </I18nProvider>
  );
  if (root.hasChildNodes() && lang === "en") {
    hydrateRoot(root, app);
  } else {
    createRoot(root).render(app);
    markTextBoundariesForPrerender(root);
  }
});
