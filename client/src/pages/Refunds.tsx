import LegalLayout from "./LegalLayout";
import { CONTACT_EMAIL } from "@/lib/site";

export default function Refunds() {
  return <LegalLayout
    eyebrow="Our commitment · purchases"
    title="Refund Policy"
    path="/refunds"
    documentTitle="Refund Policy | CairnCareers"
    description="CairnCareers' 30-day money-back guarantee: for pre-launch purchases, 30 days from launch on October 31; for purchases made after launch, 30 days from purchase."
    updated="August 27, 2026"
    updatedDateTime="2026-08-27"
    intro={<><strong>Every CairnCareers purchase is covered by a 30-day money-back guarantee.</strong> This page states exactly when that window starts, for a pre-order purchase and for a purchase made after launch.</>}
    sections={[
      { title: "Pre-order refunds (before launch)", body: <><p>CairnCareers launches October 31, 2026. If you pre-order Premium before then (at the discounted pre-order rate, $8/month instead of $11/month, or $61/year instead of $86/year), your 30-day money-back guarantee counts from the launch date, not from your purchase date.</p><p>In practice this means an early pre-order gets a longer window than 30 days, not a shorter one: purchase today and you still have a full 30 days starting October 31 to decide the product is right for you.</p></> },
      { title: "Refunds after launch", body: <><p>Once CairnCareers is live, every plan (Pro or Premium, monthly or annual) carries a standard 30-day money-back guarantee counted from your purchase date. Ask within that window and you receive a full refund.</p><p>The exact price, term, and renewal behavior of each plan is displayed at checkout before you pay. No recurring charge is created unless it is disclosed and affirmatively accepted at checkout.</p></> },
      { title: "How to request a refund", body: <p>Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> or use the <a href="/contact">contact page</a>. Include the email address you used at purchase and the approximate purchase date. Approved refunds go back to the original payment method. Stripe, our payment processor, typically returns funds within 5 to 10 business days of the refund being issued.</p> },
      { title: "Data after a refund", body: <p>A refund request can also start deletion of your related assessment data and delivered materials. Tell us in your refund email if you want your data deleted, and we will confirm when it is done, subject to short-lived backup retention described in the <a href="/privacy">Privacy Policy</a>.</p> },
      { title: "Chargebacks and service discontinuation", body: <p>If a billing issue occurs, please contact us before starting a chargeback so we can resolve the issue directly, which is almost always faster. If CairnCareers discontinues a paid service, affected customers will be notified and refunded for any unused portion of their term.</p> },
      { title: "Questions", body: <p>Questions about this policy can be sent to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. This page should be read together with the <a href="/terms">Terms of Service</a>.</p> },
    ]}
  />;
}
