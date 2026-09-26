import LegalLayout from "./LegalLayout";
import { CONTACT_EMAIL } from "@/lib/site";

export default function Refunds() {
  return <LegalLayout
    eyebrow="Our commitment · purchases"
    title="Refund Policy"
    path="/refunds"
    documentTitle="Refund Policy: 30-Day Money-Back Guarantee | CairnCareers"
    description="CairnCareers' 30-day money-back guarantee: every plan carries a full refund window of 30 days, counted from the date of purchase."
    updated="September 24, 2026"
    updatedDateTime="2026-09-24"
    intro={<><strong>Every CairnCareers purchase is covered by a 30-day money-back guarantee.</strong> This page states exactly when that window starts and how to request a refund.</>}
    sections={[
      { title: "Refunds after launch", body: <><p>Once CairnCareers is live, every plan (Pro or Premium, monthly or annual) carries a standard 30-day money-back guarantee counted from your purchase date. Ask within that window and you receive a full refund.</p><p>The exact price, term, and renewal behavior of each plan is displayed at checkout before you pay. No recurring charge is created unless it is disclosed and affirmatively accepted at checkout.</p></> },
      { title: "How to request a refund", body: <p>Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or use the <a href="/contact">contact page</a>. Include the email address you used at purchase and the approximate purchase date. Approved refunds go back to the original payment method. Stripe, our payment processor, typically returns funds within 5 to 10 business days of the refund being issued.</p> },
      { title: "Data after a refund", body: <p>A refund request can also start deletion of your related assessment data and delivered materials. Tell us in your refund email if you want your data deleted, and we will confirm when it is done, subject to short-lived backup retention described in the <a href="/privacy">Privacy Policy</a>.</p> },
      { title: "Chargebacks and service discontinuation", body: <p>If a billing issue occurs, please contact us before starting a chargeback so we can resolve the issue directly, which is almost always faster. If CairnCareers discontinues a paid service, affected customers will be notified and refunded for any unused portion of their term.</p> },
      { title: "Questions", body: <p>Questions about this policy can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. This page should be read together with the <a href="/terms">Terms of Service</a>.</p> },
    ]}
  />;
}
