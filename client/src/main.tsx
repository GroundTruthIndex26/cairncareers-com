import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./hero-unfurl.css";
import { I18nProvider } from "./lib/i18n";
import { scheduleAnalytics } from "./lib/analytics";

// Analytics loads after first paint; see lib/analytics.ts for why.
scheduleAnalytics();

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <App />
  </I18nProvider>,
);
