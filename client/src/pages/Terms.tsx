import LegalLayout from "./LegalLayout";
import { CONTACT_EMAIL } from "@/lib/site";

export default function Terms() {
  return <LegalLayout
    eyebrow="Legal · using CairnCareers"
    title="Terms of Service"
    path="/terms"
    documentTitle="Terms of Service: Your Rights and Ours | CairnCareers"
    description="The terms that govern using CairnCareers: what the service is (and isn't), your responsibilities, ownership of content, and liability and refund terms."
    updated="August 23, 2026"
    updatedDateTime="2026-08-23"
    intro={<>These Terms of Service govern your use of CairnCareers and its career-planning materials. <strong>By using the site, you agree to use it thoughtfully and in accordance with these terms.</strong> We have written them in plain language because the important parts should be understandable.</>}
    sections={[
      { title: "What CairnCareers provides", body: <><p>CairnCareers provides career context and practical prompts for college students and recent graduates who are considering early-career directions. The site may offer an assessment, role context, networking guidance, and other materials as features become available.</p><p>Any paid feature, its scope, its price, its delivery timing, and its payment terms will be presented clearly before checkout. No recurring charge or subscription will be created unless it is expressly disclosed and affirmatively accepted at checkout.</p></> },
      { title: "What the service is not", body: <><p>CairnCareers is an informational and planning tool. It is not professional career counseling, legal advice, financial advice, or a guarantee of employment, compensation, admission, or any other outcome.</p><p>Career decisions depend on many factors. Use your own judgment, seek qualified advice where appropriate, and treat any prompt, score, comparison, or suggested action as a starting point for further research and conversation.</p></> },
      { title: "Eligibility and your responsibilities", body: <><p>By using CairnCareers, you represent that you are at least 18 years old and that information you submit is accurate to the best of your knowledge. Do not submit information about another person without their permission.</p><p>You may not use the site for unlawful purposes, attempt to access systems without authorization, disrupt the service with automated activity, scrape or republish material without permission, resell CairnCareers materials, or impersonate another person.</p></> },
      { title: "Your content and our content", body: <><p>You retain ownership of information you provide. You grant CairnCareers a limited right to use that information only to operate, improve, and deliver the service as described in the Privacy Policy.</p><p>The CairnCareers name, site design, text, visual identity, methodology, and delivered materials are owned by CairnCareers or its licensors. You may use materials delivered to you for your personal career planning. You may not republish, resell, or use them commercially without written permission.</p></> },
      { title: "Availability, disclaimers, and liability", body: <><p>We aim to keep the service available and useful, but we cannot promise uninterrupted access, error-free operation, or that every result will be complete or appropriate for every situation. We may change, pause, or discontinue features as the product develops.</p><p>To the maximum extent permitted by law, CairnCareers is not liable for indirect, incidental, special, consequential, or punitive damages, including lost income, lost opportunities, or career outcomes arising from use of the site. Any mandatory consumer rights remain unaffected.</p></> },
      { title: "Refunds, changes, and questions", body: <><p>The <a href="/refunds">Refund Policy</a> states the terms for the current pre-order and for future subscription plans, and is incorporated into these terms.</p><p>We may update these terms. Material changes will be reflected in the date above and, where appropriate, communicated before they take effect. Questions can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or through the <a href="/contact">contact page</a>.</p></> },
    ]}
  />;
}
