import { createRoot } from "react-dom/client";
import App, { loadPage } from "./App";
import "./index.css";
import "./hero-unfurl.css";
import { I18nProvider, initialLang, loadStrings } from "./lib/i18n";
import { scheduleAnalytics } from "./lib/analytics";

// Analytics loads after first paint; see lib/analytics.ts for why.
scheduleAnalytics();

// Wait for this page's code and this visitor's language before the first
// render. Until then the prerendered HTML stays on screen untouched; rendering
// early would replace it with an empty page and then fill it back in.
Promise.all([loadPage(window.location.pathname), loadStrings(initialLang())]).then(([Page]) => {
  createRoot(document.getElementById("root")!).render(
    <I18nProvider>
      <App Page={Page} />
    </I18nProvider>,
  );
});
