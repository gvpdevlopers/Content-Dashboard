import {
  Check,
  Gauge,
  Layers3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Section from "../Section";
import SectionHeading from "../SectionHeading";
import Reveal from "../Reveal";
import Stagger, { StaggerItem } from "../Stagger";

const benefits = [
  {
    icon: Layers3,
    title: "One connected experience",
    description:
      "Keep services, requirements, orders, and account activity connected in one platform.",
  },
  {
    icon: Gauge,
    title: "Built for clarity",
    description:
      "Structured service options make it easier to understand what you are ordering before you commit.",
  },
  {
    icon: ShieldCheck,
    title: "Reliable workflow",
    description:
      "Your order information and selected requirements stay organized throughout the process.",
  },
  {
    icon: Sparkles,
    title: "Designed around you",
    description:
      "A modern client experience designed to reduce friction from discovery to delivery.",
  },
];

const WhyGlowSection = () => {
  return (
    <Section className="bg-white">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal>
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeading
              eyebrow="Why Glow"
              title="A better way to"
              highlight="work together."
              description="The platform brings the client side of the Glow Ventures experience into one focused workspace."
            />

            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-zinc-800">
              <Check size={17} />
              Built for a smoother client journey
            </div>
          </div>
        </Reveal>

        <Stagger className="grid gap-4 sm:grid-cols-2">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <StaggerItem key={benefit.title}>
                <article className="group h-full rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_20px_50px_rgba(24,24,27,0.07)] sm:p-7">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-zinc-700 shadow-sm transition-all duration-300 group-hover:bg-zinc-900 group-hover:text-white">
                    <Icon size={19} />
                  </div>

                  <h3 className="mt-7 text-lg font-bold tracking-[-0.02em] text-zinc-900">
                    {benefit.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    {benefit.description}
                  </p>
                </article>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </Section>
  );
};

export default WhyGlowSection;