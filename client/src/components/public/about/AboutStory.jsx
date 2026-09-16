import { ArrowUpRight, Target } from "lucide-react";

import Section from "../Section";
import Reveal from "../Reveal";
import GradientText from "../GradientText";

const AboutStory = () => {
  return (
    <Section className="bg-[var(--color-surface-soft)]">
      <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
        <Reveal>
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-800 shadow-sm">
              <Target size={20} />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Who we are
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
              Growth starts with
              <br />
              <GradientText>clarity.</GradientText>
            </h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="space-y-6 lg:pt-10">
            <p className="text-xl font-medium leading-8 tracking-[-0.015em] text-zinc-800 sm:text-2xl sm:leading-9">
              Glow Ventures is a marketing and PR agency focused on
              helping businesses move from ideas to measurable
              progress.
            </p>

            <p className="text-base leading-7 text-zinc-500 sm:text-lg sm:leading-8">
              Since 2017, the company has brought together different
              disciplines across marketing, public relations, and
              content production. The goal is to create a connected
              approach rather than treating each part of growth as an
              isolated activity.
            </p>

            <div className="flex items-center gap-2 pt-2 text-sm font-semibold text-zinc-900">
              <span>Strategy, progress, growth</span>
              <ArrowUpRight size={16} />
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
};

export default AboutStory;