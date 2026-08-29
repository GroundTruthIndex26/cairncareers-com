import { PageFooter, PageHeader } from "@/components/PageChrome";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function NotFound() {
  usePageMeta({
    title: "Page Not Found | CairnCareers",
    description: "The page you're looking for doesn't exist. Return to CairnCareers to compare career paths with salary, growth, and AI-exposure context.",
  });

  return (
    <div className="site-shell">
      <PageHeader />
      <section className="page-hero" style={{ textAlign: "center" }}>
        <div className="container">
          <span className="section-label" style={{ margin: "0 auto" }}><span>404</span></span>
          <h1 style={{ marginLeft: "auto", marginRight: "auto" }}>This marker doesn't exist.</h1>
          <p style={{ marginLeft: "auto", marginRight: "auto" }}>
            The page you are looking for may have been moved or deleted. The route back to the trail is below.
          </p>
          <a className="primary-cta" href="/" style={{ marginTop: 26 }}>Back to the home page</a>
        </div>
      </section>
      <PageFooter />
    </div>
  );
}
