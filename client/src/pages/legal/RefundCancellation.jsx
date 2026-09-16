import LegalHero from "../../components/public/legal/LegalHero";
import LegalLayout from "../../components/public/legal/LegalLayout";
import LegalLastUpdated from "../../components/public/legal/LegalLastUpdated";
import LegalSection from "../../components/public/legal/LegalSection";

const RefundCancellation = () => {
  return (
    <>
      <LegalHero
        eyebrow="Refund & Cancellation"
        title="A clear approach to"
        description="This policy explains the general process for cancellations and refunds relating to services ordered through the Glow Ventures platform."
      />

      <LegalLayout>
        <LegalLastUpdated />

        <LegalSection
          number="01"
          title="Overview"
        >
          <p>
            Glow Ventures aims to provide clear service and order
            information before an order is submitted. Clients should
            review the selected service, options, quantities,
            requirements, and applicable charges before confirming an
            order.
          </p>
        </LegalSection>

        <LegalSection
          number="02"
          title="Cancellation Requests"
        >
          <p>
            Cancellation requests should be submitted as soon as
            possible after placing an order.
          </p>

          <p>
            Whether an order can be cancelled may depend on the
            service selected, the stage of work, and whether
            production or fulfilment has already started.
          </p>

          <p>
            Clients should contact Glow Ventures through the public
            contact channel with their order details when requesting
            a cancellation.
          </p>
        </LegalSection>

        <LegalSection
          number="03"
          title="Refund Eligibility"
        >
          <p>
            Refund eligibility may depend on the specific service,
            order status, work already performed, and the applicable
            commercial terms for that order.
          </p>

          <p>
            Services that have already entered production or
            fulfilment may be subject to different cancellation or
            refund conditions.
          </p>
        </LegalSection>

        <LegalSection
          number="04"
          title="Online Payments"
        >
          <p>
            Where an eligible refund is approved for an order paid
            online, the refund will be processed using the applicable
            payment process or payment provider.
          </p>

          <p>
            The time taken for a refund to appear may depend on the
            payment provider and the client's bank or financial
            institution.
          </p>
        </LegalSection>

        <LegalSection
          number="05"
          title="COD Orders"
        >
          <p>
            Orders using a cash-on-delivery process may be subject to
            separate verification and order-handling requirements.
          </p>

          <p>
            Cancellation or refund treatment for COD orders may
            depend on the order status and whether any service work
            has already commenced.
          </p>
        </LegalSection>

        <LegalSection
          number="06"
          title="Non-Refundable Work"
        >
          <p>
            Where work has already been performed, production
            resources have been committed, or a service has otherwise
            progressed substantially, the applicable amount may not
            be refundable depending on the specific commercial terms
            of the order.
          </p>
        </LegalSection>

        <LegalSection
          number="07"
          title="Duplicate or Incorrect Payments"
        >
          <p>
            If you believe that you have been charged more than once
            for the same transaction or that a payment was made in
            error, please contact Glow Ventures with the relevant
            order and transaction information so the payment can be
            reviewed.
          </p>
        </LegalSection>

        <LegalSection
          number="08"
          title="How to Request a Refund or Cancellation"
        >
          <p>
            Requests should include the relevant order ID, the
            client's registered contact information, and a brief
            explanation of the request.
          </p>

          <p>
            Glow Ventures will review the request against the
            applicable service and order conditions.
          </p>
        </LegalSection>

        <LegalSection
          number="09"
          title="Policy Updates"
        >
          <p>
            This Refund & Cancellation Policy may be updated when
            service processes, payment methods, or commercial
            policies change.
          </p>

          <p>
            The latest version will be published on this page.
          </p>
        </LegalSection>

        <LegalSection
          number="10"
          title="Contact"
        >
          <p>
            For cancellation or refund-related questions, contact
            Glow Ventures through the public contact page and include
            your order details.
          </p>
        </LegalSection>
      </LegalLayout>
    </>
  );
};

export default RefundCancellation;