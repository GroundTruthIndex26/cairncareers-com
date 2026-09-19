import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./hero-unfurl.css";
import { I18nProvider } from "./lib/i18n";
import { analytics } from "@heycatch/sdk";

// TODO: add `requestBatching: false` once a stable @heycatch/sdk accepts it
// (0.7.0 does not). Every internal link is a plain <a href>, so each
// navigation is a full page load and a held batch can leave with it.
analytics.init({
  projectKey: "hck_pk_UsKbBSEW_ueO-fGreK3McdcUpnajFEsQ",
  install: {
    framework: "vite-react",
    agent: "claude-code",
  },
});

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <App />
  </I18nProvider>,
);
