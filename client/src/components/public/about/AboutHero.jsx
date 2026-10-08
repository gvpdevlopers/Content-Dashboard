import { Sparkles } from "lucide-react";

import PublicHero from "../PublicHero";
import PublicButton from "../PublicButton";

const AboutHero = () => {
  return (
    <PublicHero
      className="bg-[#f7f7f5]"
      eyebrow="A little about us"
      eyebrowIcon={Sparkles}
      title="We Ignite"
      highlight="Growth."
      description="Glow Ventures is a marketing and PR agency connecting Internet Marketing, Public Relations, and Content Production around business ambition."
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