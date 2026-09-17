import LegalHero from "../../components/public/legal/LegalHero";
import LegalLayout from "../../components/public/legal/LegalLayout";
import LegalLastUpdated from "../../components/public/legal/LegalLastUpdated";
import LegalSection from "../../components/public/legal/LegalSection";

const TermsConditions = () => {
  return (
    <>
      {/* =====================================================
          HERO
      ====================================================== */}
      <LegalHero
        eyebrow="Terms & Conditions"
        title="Clear terms for"
        description="These terms describe the general conditions for accessing and using the Glow Ventures website and client platform."
        lastUpdated="September 2026"
        policyType="Website & Services"
      />

      {/* =====================================================
          LEGAL CONTENT
      ====================================================== */}
      <LegalLayout>
        <LegalLastUpdated date="September 2026" />

        {/* =================================================
            01 — ACCEPTANCE OF TERMS
        ================================================== */}
        <LegalSection
          number="01"
          title="Acceptance of Terms"
        >
          <p>
            By accessing or using the Glow Ventures website or client
            platform, you agree to comply with these Terms &
            Conditions and any applicable policies referenced on the
            website.
          </p>

          <p>
            If you do not agree with these terms, you should not use
            the platform or place an order through it.
          </p>
        </LegalSection>

        {/* =================================================
            02 — CLIENT ACCOUNTS
        ================================================== */}
        <LegalSection
          number="02"
          title="Client Accounts"
        >
          <p>
            Certain platform functionality requires an authorized
            client account.
          </p>

          <p>
            Users are responsible for keeping their login credentials
            secure and for activity performed through their account.
            Users should notify Glow Ventures if they become aware of
            unauthorized account access.
          </p>
        </LegalSection>

        {/* =================================================
            03 — SERVICES AND ORDERS
        ================================================== */}
        <LegalSection
          number="03"
          title="Services and Orders"
        >
          <p>
            Services available through the client platform may have
            different pricing structures, requirements, quantities,
            options, and delivery conditions.
          </p>

          <p>
            Before submitting an order, the client is responsible for
            reviewing the selected service, options, quantities,
            requirements, and applicable charges.
          </p>
        </LegalSection>

        {/* =================================================
            04 — PRICING AND PAYMENT
        ================================================== */}
        <LegalSection
          number="04"
          title="Pricing and Payment"
        >
          <p>
            Applicable charges are displayed during the ordering
            process based on the service and selections made by the
            client.
          </p>

          <p>
            Online payments may be processed through an external
            payment provider. An order may be considered confirmed
            according to the payment and order status communicated by
            the platform.
          </p>
        </LegalSection>

        {/* =================================================
            05 — CLIENT-PROVIDED INFORMATION
        ================================================== */}
        <LegalSection
          number="05"
          title="Client-Provided Information"
        >
          <p>
            Clients are responsible for providing accurate and
            complete information required to fulfil an order.
          </p>

          <p>
            Delays or issues caused by incomplete, inaccurate, or
            materially changed requirements may affect the delivery
            of the requested service.
          </p>
        </LegalSection>

        {/* =================================================
            06 — ACCEPTABLE USE
        ================================================== */}
        <LegalSection
          number="06"
          title="Acceptable Use"
        >
          <p>
            Users must not use the website or platform for unlawful,
            fraudulent, abusive, or unauthorized purposes.
          </p>

          <p>
            Users must not attempt to interfere with platform
            security, gain unauthorized access, introduce malicious
            code, or misuse another user's account or information.
          </p>
        </LegalSection>

        {/* =================================================
            07 — INTELLECTUAL PROPERTY
        ================================================== */}
        <LegalSection
          number="07"
          title="Intellectual Property"
        >
          <p>
            Unless otherwise agreed in writing, the Glow Ventures
            website, platform interface, branding, software, and
            associated materials remain protected by applicable
            intellectual property laws.
          </p>

          <p>
            Service-specific ownership or usage rights relating to
            delivered content may depend on the applicable service
            agreement or commercial arrangement.
          </p>
        </LegalSection>

        {/* =================================================
            08 — THIRD-PARTY SERVICES
        ================================================== */}
        <LegalSection
          number="08"
          title="Third-Party Services"
        >
          <p>
            The platform may rely on third-party services for
            functions including payment processing, hosting,
            communication, analytics, or other infrastructure.
          </p>

          <p>
            Third-party services may have separate terms and
            policies that apply to their respective services.
          </p>
        </LegalSection>

        {/* =================================================
            09 — SERVICE AVAILABILITY
        ================================================== */}
        <LegalSection
          number="09"
          title="Service Availability"
        >
          <p>
            Glow Ventures may update, modify, suspend, or discontinue
            parts of the website or platform when reasonably necessary
            for maintenance, improvements, security, or operational
            reasons.
          </p>
        </LegalSection>

        {/* =================================================
            10 — LIMITATION OF RESPONSIBILITY
        ================================================== */}
        <LegalSection
          number="10"
          title="Limitation of Responsibility"
        >
          <p>
            Information presented on the public website is intended
            for general service and platform information. Specific
            project requirements, pricing, timelines, and deliverables
            may vary by service and order.
          </p>

          <p>
            Any specific commercial commitments should be confirmed
            through the applicable order, agreement, or written
            communication with Glow Ventures.
          </p>
        </LegalSection>

        {/* =================================================
            11 — CHANGES TO THESE TERMS
        ================================================== */}
        <LegalSection
          number="11"
          title="Changes to These Terms"
        >
          <p>
            These Terms & Conditions may be updated when the website,
            platform, services, or applicable requirements change.
            Updated terms will be published on this page.
          </p>
        </LegalSection>

        {/* =================================================
            12 — CONTACT
        ================================================== */}
        <LegalSection
          number="12"
          title="Contact"
        >
          <p>
            Questions regarding these terms can be submitted through
            the Glow Ventures contact page.
          </p>
        </LegalSection>
      </LegalLayout>
    </>
  );
};

export default TermsConditions;