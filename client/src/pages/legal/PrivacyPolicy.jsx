import LegalHero from "../../components/public/legal/LegalHero";
import LegalLayout from "../../components/public/legal/LegalLayout";
import LegalLastUpdated from "../../components/public/legal/LegalLastUpdated";
import LegalSection from "../../components/public/legal/LegalSection";

const PrivacyPolicy = () => {
  return (
    <>
      {/* =====================================================
          HERO
      ====================================================== */}
      <LegalHero
        eyebrow="Privacy Policy"
        title="Privacy matters."
        description="This policy explains how information may be collected and used when you visit the Glow Ventures website or use the client platform."
        lastUpdated="September 2026"
        policyType="Website & Client Platform"
      />

      {/* =====================================================
          LEGAL CONTENT
      ====================================================== */}
      <LegalLayout>
        <LegalLastUpdated date="September 2026" />

        {/* =================================================
            01 — INTRODUCTION
        ================================================== */}
        <LegalSection
          number="01"
          title="Introduction"
        >
          <p>
            Glow Ventures respects the privacy of visitors,
            clients, and users of its website and client platform.
            This Privacy Policy describes the types of information
            that may be collected when you use our website,
            communicate with us, or use our services through the
            client platform.
          </p>

          <p>
            By using the website or platform, you acknowledge that
            information may be handled as described in this policy.
          </p>
        </LegalSection>

        {/* =================================================
            02 — INFORMATION WE COLLECT
        ================================================== */}
        <LegalSection
          number="02"
          title="Information We Collect"
        >
          <p>
            Depending on how you interact with Glow Ventures, we may
            collect information such as your name, email address,
            company or business information, account credentials,
            order information, service selections, and information
            you provide as part of an enquiry or project requirement.
          </p>

          <p>
            Information may also be generated through your use of the
            client platform, such as order status, transaction
            references, and activity associated with your account.
          </p>
        </LegalSection>

        {/* =================================================
            03 — HOW WE USE INFORMATION
        ================================================== */}
        <LegalSection
          number="03"
          title="How We Use Information"
        >
          <p>
            Information may be used to provide and manage requested
            services, process orders, communicate with clients,
            respond to enquiries, maintain accounts, provide customer
            support, and improve the website and platform experience.
          </p>

          <p>
            Information may also be used where necessary to maintain
            platform security, prevent misuse, and comply with
            applicable legal or regulatory requirements.
          </p>
        </LegalSection>

        {/* =================================================
            04 — PAYMENTS
        ================================================== */}
        <LegalSection
          number="04"
          title="Payments"
        >
          <p>
            Online payments made through the platform are processed
            through the applicable payment service provider. Payment
            information required to process a transaction may be
            handled by the payment provider according to its own
            privacy policy and terms.
          </p>

          <p>
            Glow Ventures does not require users to provide payment
            card credentials directly through ordinary website
            enquiry forms.
          </p>
        </LegalSection>

        {/* =================================================
            05 — COOKIES
        ================================================== */}
        <LegalSection
          number="05"
          title="Cookies and Similar Technologies"
        >
          <p>
            The website or platform may use cookies or similar
            technologies where required for functionality, security,
            preferences, analytics, or other legitimate website
            operations.
          </p>

          <p>
            The specific technologies used may change as the website
            and platform evolve.
          </p>
        </LegalSection>

        {/* =================================================
            06 — DATA SECURITY
        ================================================== */}
        <LegalSection
          number="06"
          title="Data Security"
        >
          <p>
            Reasonable technical and organizational measures are used
            to protect information handled through the website and
            platform.
          </p>

          <p>
            However, no internet-based service can guarantee absolute
            security. Users should also take appropriate steps to
            protect their account credentials and access devices.
          </p>
        </LegalSection>

        {/* =================================================
            07 — DATA RETENTION
        ================================================== */}
        <LegalSection
          number="07"
          title="Data Retention"
        >
          <p>
            Information may be retained for as long as reasonably
            necessary to provide services, maintain business and
            transaction records, resolve disputes, maintain security,
            or satisfy applicable legal and regulatory obligations.
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
            The website or platform may use third-party services for
            functions such as payment processing, hosting, analytics,
            communication, or other infrastructure.
          </p>

          <p>
            Those providers may process information according to
            their own applicable policies and terms.
          </p>
        </LegalSection>

        {/* =================================================
            09 — USER RESPONSIBILITIES
        ================================================== */}
        <LegalSection
          number="09"
          title="Your Responsibilities"
        >
          <p>
            Users are responsible for providing accurate information
            and keeping account credentials confidential. If you
            believe that your account has been accessed without
            authorization, you should contact Glow Ventures promptly.
          </p>
        </LegalSection>

        {/* =================================================
            10 — POLICY UPDATES
        ================================================== */}
        <LegalSection
          number="10"
          title="Policy Updates"
        >
          <p>
            This Privacy Policy may be updated from time to time to
            reflect changes in the website, platform, services, or
            applicable requirements.
          </p>

          <p>
            The updated version will be published on this page with a
            revised effective or update date where appropriate.
          </p>
        </LegalSection>

        {/* =================================================
            11 — CONTACT
        ================================================== */}
        <LegalSection
          number="11"
          title="Contact"
        >
          <p>
            If you have questions about this Privacy Policy or the
            handling of your information, please use the public
            contact page to get in touch with Glow Ventures.
          </p>
        </LegalSection>
      </LegalLayout>
    </>
  );
};

export default PrivacyPolicy;