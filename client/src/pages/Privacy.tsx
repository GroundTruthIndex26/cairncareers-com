import LegalLayout from "./LegalLayout";
import { CONTACT_EMAIL } from "@/lib/site";

export default function Privacy() {
  return <LegalLayout
    eyebrow="Legal · your information"
    title="Privacy Policy"
    path="/privacy"
    documentTitle="Privacy Policy | CairnCareers"
    description="How CairnCareers collects, uses, and protects your information as a college student or recent graduate: what we collect, why, and the choices and rights you have."
    updated="August 23, 2026"
    updatedDateTime="2026-08-23"
    intro={<><strong>CairnCareers is designed to respect your right to privacy and control over your information.</strong> This policy explains what we collect, why we collect it, and the choices you have. We do not sell or trade personal information.</>}
    sections={[
      { title: "What we collect", body: <><p>We collect only information that is relevant to providing the service you ask us to provide. That may include your email address, expected or recent graduation date, career interests, assessment responses, and the information you choose to share about your education, projects, work experience, or goals.</p><p>We also receive limited technical information that browsers commonly provide, such as device and browser details, interaction and referral information, and an approximate country or region used to localize the experience. We may use cookies or similar tools to remember a session choice, such as whether you have seen an email-capture prompt.</p></> },
      { title: "Why we collect it", body: <><p>We use information to provide career-planning context, deliver requested materials and pre-order updates, respond to support requests, and improve the clarity and reliability of CairnCareers.</p><p>We do not use your personal information for targeted advertising, sell it to data brokers, or train models for resale. Where we analyze product usage, we aim to use aggregated or de-identified patterns rather than information tied back to you.</p></> },
      { title: "Who helps us operate", body: <><p>We use carefully selected service providers to operate CairnCareers. The current design uses Supabase to store consented form submissions, Resend to deliver requested email, Stripe to process payments, Anthropic to answer support questions asked in the on-site guide, analytics services, and infrastructure providers that host the website.</p><p>These providers receive only the information needed to perform their role. We expect them to protect that information under their own applicable terms and contractual commitments. We will update this policy when the active provider list materially changes.</p></> },
      { title: "Your choices and rights", body: <><p>You can ask to access, correct, or delete the personal information associated with you. You can also opt out of promotional email through the unsubscribe link in an email or by writing to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p><p>We will respond to valid requests within the period required by applicable law. Depending on where you live, you may have additional rights under privacy laws in your jurisdiction.</p></> },
      { title: "Retention and security", body: <><p>We retain personal information only for as long as it is reasonably needed to provide the service, maintain records, comply with law, or resolve disputes. You may ask us to delete information, subject to legal or operational requirements such as short-lived backup retention.</p><p>We use reasonable administrative, technical, and organizational safeguards to protect information. No online system can promise absolute security. If a security incident requires notification under applicable law, we will provide notice as required.</p></> },
      { title: "Children and policy changes", body: <><p>CairnCareers is intended for people who are at least 18 years old. We do not knowingly collect personal information from children. If you believe a minor has provided information, contact <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> so that we can investigate and delete it where appropriate.</p><p>We may update this policy as the product develops. Material changes will be reflected in the date above and, where appropriate, communicated before they take effect.</p></> },
      { title: "Contact", body: <p>Questions about this policy or your information can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or through the <a href="/contact">contact page</a>. Please do not submit sensitive personal information, such as government identifiers or financial account numbers, through the site.</p> },
    ]}
  />;
}
