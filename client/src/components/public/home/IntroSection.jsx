import { ArrowUpRight, Sparkles } from "lucide-react";

import Section from "../Section";
import Reveal from "../Reveal";
import GradientText from "../GradientText";

const IntroSection = () => {
  return (
    <Section className="bg-white">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal>
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              <Sparkles size={14} />
              The Glow Experience
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
              From idea to
              <br />
              <GradientText>execution.</GradientText>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="max-w-2xl lg:pt-10">
            <p className="text-xl font-medium leading-8 tracking-[-0.015em] text-[var(--color-text-secondary)] sm:text-2xl sm:leading-9">
              Great content starts with clarity. Our platform gives clients a
              straightforward way to discover services, define requirements,
              place orders, and keep track of the work.
            </p>

            <div className="mt-7 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
              <span>Built around a better client experience</span>
              <ArrowUpRight size={16} />
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
};

export default IntroSection;