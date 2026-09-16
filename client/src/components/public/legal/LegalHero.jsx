import { FileText } from "lucide-react";

import Reveal from "../Reveal";
import GradientText from "../GradientText";

const LegalHero = ({ eyebrow, title, description }) => {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-surface-soft)]">
      <div
        aria-hidden="true"
        className="public-ambient-glow absolute -right-32 -top-32 h-80 w-80 bg-blue-500/15 sm:h-[30rem] sm:w-[30rem]"
      />

      <div
        aria-hidden="true"
        className="public-ambient-glow absolute -bottom-40 left-1/4 h-72 w-72 bg-cyan-400/10"
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-4xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 backdrop-blur sm:text-sm">
              <FileText size={14} />
              {eyebrow}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="mt-6 text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[0.96] tracking-[-0.05em] text-zinc-950">
              {title}
              <br />
              <GradientText>Glow Ventures.</GradientText>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-500 sm:text-lg sm:leading-8">
              {description}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default LegalHero;