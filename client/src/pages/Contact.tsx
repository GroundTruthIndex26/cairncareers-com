import { ArrowRight, Check, LoaderCircle, Mail, MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { PageFooter, PageHeader, PageHero } from "@/components/PageChrome";
import { usePageMeta } from "@/hooks/usePageMeta";
import { CONTACT_EMAIL, endpoints } from "@/lib/site";

type ContactForm = { name: string; email: string; subject: string; message: string; website: string };

const initialForm: ContactForm = { name: "", email: "", subject: "", message: "", website: "" };
const BREADCRUMB = [{ name: "Home", href: "/" }, { name: "Contact", href: "/contact" }];

export default function Contact() {
  usePageMeta({
    title: "Contact CairnCareers | Questions About Career Planning & Pre-Order",
    description: "Ask CairnCareers about the pre-order, career-planning features, or how the site can better serve college students and recent graduates.",
  });

  const [form, setForm] = useState<ContactForm>(initialForm);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const update = (field: keyof ContactForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setError("");
    try {
      if (!endpoints.contact) throw new Error(`Contact delivery is not configured yet. Please email ${CONTACT_EMAIL} directly.`);
      const response = await fetch(endpoints.contact, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error ?? "We could not send your message. Please try again.");
      setStatus("success");
      setForm(initialForm);
      toast.success("Message sent", { description: "Thank you. The CairnCareers team will reply through the email address you provided." });
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "We could not send your message. Please try again.";
      setError(message);
      setStatus("error");
      toast.error("We could not send your message", { description: message });
    }
  };

  return (
    <div className="site-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbJsonLd(BREADCRUMB) }} />
      <PageHeader />
      <PageHero eyebrow="Contact · thoughtful questions welcome" title="Let's find the next useful conversation." breadcrumb={BREADCRUMB}>
        <p>Ask about the pre-order, a future CairnCareers offering, or how the site can better serve college students and recent graduates.</p>
      </PageHero>

      <div className="container contact-grid">
        <aside className="contact-info">
          <div className="row">
            <Mail aria-hidden="true" />
            <p>Your message goes to <strong>{CONTACT_EMAIL}</strong>, an inbox anyone can use directly.</p>
          </div>
          <div className="row">
            <MessageCircle aria-hidden="true" />
            <p>Please avoid sending sensitive personal, financial, or account information through this form.</p>
          </div>
        </aside>

        <div className="contact-form-card">
          {status === "success" ? (
            <div className="contact-success" aria-live="polite">
              <Check />
              <p style={{ marginTop: 16, fontWeight: 800, textTransform: "uppercase", fontSize: 11, letterSpacing: ".08em" }}>Message sent</p>
              <h2 style={{ margin: "8px 0 0", font: '400 32px "Archivo Black",Impact,sans-serif' }}>Thank you for reaching out.</h2>
              <p style={{ marginTop: 12 }}>Your inquiry has been sent to the CairnCareers team. We will respond through the email address you provided.</p>
              <button type="button" className="contact-submit" style={{ marginTop: 18 }} onClick={() => setStatus("idle")}>
                Send another message <ArrowRight />
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              <label className="contact-field">
                Name
                <input required disabled={status === "sending"} value={form.name} onChange={(event) => update("name", event.target.value)} autoComplete="name" />
              </label>
              <label className="contact-field">
                Email
                <input required disabled={status === "sending"} type="email" value={form.email} onChange={(event) => update("email", event.target.value)} autoComplete="email" />
              </label>
              <label className="contact-field">
                Subject
                <input required disabled={status === "sending"} value={form.subject} onChange={(event) => update("subject", event.target.value)} />
              </label>
              <label className="contact-field">
                Message
                <textarea required disabled={status === "sending"} value={form.message} onChange={(event) => update("message", event.target.value)} rows={7} />
              </label>
              <label className="sr-only" aria-hidden="true">
                Website
                <input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} />
              </label>
              <button type="submit" className="contact-submit" disabled={status === "sending"}>
                {status === "sending" ? <><LoaderCircle className="animate-spin" /> Sending your message...</> : <>Send message <ArrowRight /></>}
              </button>
              {error && (
                <p role="alert" style={{ marginTop: 14, fontSize: 13, fontWeight: 700 }}>
                  {error} <a href={`mailto:${CONTACT_EMAIL}`}>Email us directly</a>.
                </p>
              )}
              <p style={{ marginTop: 14, fontSize: 12, lineHeight: 1.5 }}>
                By sending a message, you agree that CairnCareers may use the information provided to respond to your inquiry, as described in the <a href="/privacy">Privacy Policy</a>.
              </p>
            </form>
          )}
        </div>
      </div>

      <PageFooter />
    </div>
  );
}
