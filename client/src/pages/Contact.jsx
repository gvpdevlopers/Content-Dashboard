import { useEffect } from "react";

import ContactHero from "../components/public/contact/ContactHero";
import ContactInfo from "../components/public/contact/ContactInfo";
import ContactForm from "../components/public/contact/ContactForm";
import Section from "../components/public/Section";

const Contact = () => {
  useEffect(() => {
    if (window.location.hash === "#contact-form") {
      const scrollToForm = () => {
        const element = document.getElementById("contact-form");

        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      };

      // Wait until the Contact page has rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToForm);
      });
    }
  }, []);

  return (
    <>
      <ContactHero />

      {/* =====================================================
          CONTACT CONTENT
      ====================================================== */}
      <Section className="bg-white !py-16 sm:!py-24 lg:!py-32">
        <div className="mx-auto max-w-4xl">
          <ContactInfo />

          <div
            id="contact-form"
            className="mx-auto mt-14 max-w-3xl scroll-mt-24 border-t border-zinc-200 pt-10 sm:mt-20 sm:pt-14"
          >
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
};

export default Contact;