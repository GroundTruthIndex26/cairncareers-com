/**
 * CairnCareers revision style note: preserve the brand's editorial utility look,
 * with a light document surface and a decisive near-black hero.
 */
import { lazy, Suspense, type ComponentType } from "react";
import CanonicalUrl from "./components/CanonicalUrl";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

// The toast library only matters once a form is submitted, so it loads in its
// own chunk instead of sitting in the bundle every visitor parses before the
// page is interactive. lib/toast.ts loads the same chunk when a toast fires.
const Toaster = lazy(() => import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })));

// NOTE: every path below must also appear in the ROUTES list in
// scripts/prerender.mjs. wrangler serves real 404s, so a route that is not
// prerendered is a live 404 rather than a client-side render.
//
// ONE PAGE PER VISIT
// Every internal link is a plain <a href>, so each navigation is a full page
// load and a visit only ever renders one of these. Importing all of them put
// every page's code in the bundle the homepage parses before it is
// interactive. Home stays in the main bundle because it is the landing page
// and must not wait on a second request; every other page is its own chunk.
//
// main.tsx calls loadPage() and waits for it BEFORE the first render. That is
// deliberate: React.lazy would render nothing while the chunk loads, which
// wipes the prerendered HTML and paints it again a moment later.
type Page = ComponentType;
const compare = (slug: string) => () => import("./pages/Compare").then((m): Page => () => <m.default slug={slug} />);

const PAGES: Record<string, () => Promise<Page>> = {
  "/": () => Promise.resolve(Home),
  "/roadmap": () => import("./pages/Roadmap").then((m) => m.default),
  "/methodology": () => import("./pages/Methodology").then((m) => m.default),
  "/vs/chatgpt": compare("chatgpt"),
  "/vs/careerwing": compare("careerwing"),
  "/vs/career-mirror": compare("career-mirror"),
  "/vs/maketheleap": compare("maketheleap"),
  "/contact": () => import("./pages/Contact").then((m) => m.default),
  "/privacy": () => import("./pages/Privacy").then((m) => m.default),
  "/terms": () => import("./pages/Terms").then((m) => m.default),
  "/refunds": () => import("./pages/Refunds").then((m) => m.default),
};

export function loadPage(pathname: string): Promise<Page> {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const load = PAGES[path] ?? (() => import("./pages/NotFound").then((m) => m.default));
  return load();
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App({ Page }: { Page: ComponentType }) {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <Suspense fallback={null}>
          <Toaster position="bottom-right" richColors />
        </Suspense>
        <CanonicalUrl />
        <Page />
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
