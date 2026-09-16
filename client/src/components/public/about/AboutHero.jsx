import { MessageCircle } from "lucide-react";

import PublicHero from "../PublicHero";
import AboutHeroVisual from "../hero/AboutHeroVisual";
import PublicButton from "../PublicButton";

const AboutHero = () => {
  return (
    <PublicHero
      eyebrow="About Glow Ventures"
      eyebrowIcon={MessageCircle}
      title="We build momentum"
      highlight="around ideas."
      description="Glow Ventures brings marketing, public relations, and content production together to help businesses turn ideas into meaningful progress."
      visual={<AboutHeroVisual />}
      actions={
        <>
          <PublicButton to="/services" variant="primary">
            Explore Our Services
          </PublicButton>

          <PublicButton to="/contact" variant="secondary">
            Start a Conversation
          </PublicButton>
        </>
      }
      meta={
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-semibold text-zinc-500 sm:text-sm">
          <span>Since 2017</span>

          <span className="h-1 w-1 rounded-full bg-zinc-300" />

          <span>Marketing & PR</span>

          <span className="h-1 w-1 rounded-full bg-zinc-300" />

          <span>Content</span>
        </div>
      }
    />
  );
};

export default AboutHero;