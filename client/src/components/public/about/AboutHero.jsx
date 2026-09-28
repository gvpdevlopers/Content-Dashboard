import { MessageCircle } from "lucide-react";

import PublicHero from "../PublicHero";
import PublicButton from "../PublicButton";

const AboutHero = () => {
  return (
    <PublicHero
      eyebrow="About Glow Ventures"
      eyebrowIcon={MessageCircle}
      title="We build momentum"
      highlight="around ideas."
      description="Glow Ventures brings marketing, public relations, and content production together to help businesses turn ideas into meaningful progress."
      visual={
        <div className="rounded-[24px] border border-zinc-200 bg-white p-5 shadow-[0_16px_45px_rgba(24,24,27,0.06)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
            One connected approach
          </p>
          <p className="mt-3 max-w-sm text-xl font-semibold leading-snug tracking-tight text-zinc-900 sm:text-2xl">
            Strategy, communication, and content working together.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Marketing", "Public relations", "Content"].map((discipline) => (
              <span
                key={discipline}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600"
              >
                {discipline}
              </span>
            ))}
          </div>
        </div>
      }
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