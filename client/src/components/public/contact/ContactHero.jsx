import { MessageCircle } from "lucide-react";
import PublicHero from "../PublicHero";
import PublicButton from "../PublicButton";

const ContactHero = () => {
  const handleEnquiryClick = () => {
    const form = document.getElementById("contact-form");

    if (form) {
      form.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <PublicHero
      eyebrow="Contact Glow Ventures"
      eyebrowIcon={MessageCircle}
      title="Let's start a"
      highlight="conversation."
      description="Tell us what you're working on, what you need, or where you'd like to go next."
      actions={
        <>
          <PublicButton
            onClick={handleEnquiryClick}
            variant="primary"
          >
            Send an Enquiry
          </PublicButton>

          <PublicButton
            href="tel:+919316876023"
            variant="secondary"
          >
            Call Us
          </PublicButton>
        </>
      }
    />
  );
};

export default ContactHero;