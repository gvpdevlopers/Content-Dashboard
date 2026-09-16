import { MessageCircle } from "lucide-react";

import PublicHero from "../PublicHero";
import ContactHeroVisual from "../hero/ContactHeroVisual";
import PublicButton from "../PublicButton";

const ContactHero = () => {
  return (
    <PublicHero
      eyebrow="Contact Glow Ventures"
      eyebrowIcon={MessageCircle}
      title="Let's start a"
      highlight="conversation."
      description="Tell us what you're working on, what you need, or where you'd like to go next."
      visual={<ContactHeroVisual />}
      actions={
        <>
          <PublicButton to="/contact" variant="primary">
            Send an Enquiry
          </PublicButton>

          <PublicButton href="tel:+919499555444" variant="secondary">
            Call Us
          </PublicButton>
        </>
      }
      meta={
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-semibold text-zinc-500 sm:text-sm">
          <span>team@glowventures.org</span>

          <span className="h-1 w-1 rounded-full bg-zinc-300" />

          <span>+91 9499555444</span>
        </div>
      }
    />
  );
};

export default ContactHero;