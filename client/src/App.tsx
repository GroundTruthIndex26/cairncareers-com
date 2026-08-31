/**
 * CairnCareers revision style note: preserve the brand's editorial utility look,
 * with a light document surface and a decisive near-black hero.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import CanonicalUrl from "./components/CanonicalUrl";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Methodology from "./pages/Methodology";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Refunds from "./pages/Refunds";
import Roadmap from "./pages/Roadmap";
import Terms from "./pages/Terms";

// NOTE: every path below must also appear in the ROUTES list in
// scripts/prerender.mjs. wrangler serves real 404s, so a route that is not
// prerendered is a live 404 rather than a client-side render.
function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/roadmap" component={Roadmap} />
      <Route path="/methodology" component={Methodology} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/refunds" component={Refunds} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="bottom-right" richColors />
          <CanonicalUrl />
          <AppRoutes />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
