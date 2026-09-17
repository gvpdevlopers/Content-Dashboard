import ContactHero from "../components/public/contact/ContactHero";
import ContactInfo from "../components/public/contact/ContactInfo";
import ContactForm from "../components/public/contact/ContactForm";
import ContactCTA from "../components/public/contact/ContactCTA";

import Section from "../components/public/Section";

const Contact = () => {
  return (
    <>
      <ContactHero />

      {/* =====================================================
          CONTACT CONTENT
      ====================================================== */}
      <Section className="bg-white !py-14 sm:!py-16 lg:!py-20">
        <div
          className="
            grid
            items-start
            gap-8
            lg:grid-cols-2
            lg:gap-10
            xl:gap-12
          "
        >
          {/* Sticky contact information */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <ContactInfo />
          </div>

          {/* Scrolling form */}
          <div className="min-w-0">
            <ContactForm />
          </div>
        </div>
      </Section>

      <ContactCTA />
    </>
  );
};

export default Contact;