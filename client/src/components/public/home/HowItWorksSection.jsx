import {
  ArrowRight,
  ClipboardList,
  CreditCard,
  Search,
  Settings2,
} from "lucide-react";

import Section from "../Section";
import SectionHeading from "../SectionHeading";
import Reveal from "../Reveal";
import Stagger, { StaggerItem } from "../Stagger";

const steps = [
  {
    number: "01",
    title: "Explore",
    description:
      "Browse the services available through the Glow Ventures platform.",
    icon: Search,
  },
  {
    number: "02",
    title: "Configure",
    description:
      "Choose the right options and provide the requirements for your project.",
    icon: Settings2,
  },
  {
    number: "03",
    title: "Place your order",
    description:
      "Review your selections, confirm the order, and complete the payment.",
    icon: ClipboardList,
  },
  {
    number: "04",
    title: "Track",
    description:
      "Keep everything organized and follow your orders from one place.",
    icon: CreditCard,
  },
];

const HowItWorksSection = () => {
  return (
    <Section className="bg-white">
      <Reveal>
        <SectionHeading
          eyebrow="Simple by design"
          title="From brief to"
          highlight="delivery."
          description="The platform keeps the ordering journey structured so you can focus on what you want to create."
        />
      </Reveal>

      <Stagger className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <StaggerItem key={step.number}>
              <div className="group relative h-full rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_20px_50px_rgba(24,24,27,0.07)] sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-[0.12em] text-zinc-400">
                    {step.number}
                  </span>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-zinc-700 shadow-sm transition-all duration-300 group-hover:bg-zinc-900 group-hover:text-white">
                    <Icon size={18} />
                  </div>
                </div>

                <h3 className="mt-8 text-xl font-bold tracking-[-0.025em] text-zinc-900">
                  {step.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  {step.description}
                </p>

                {index < steps.length - 1 && (
                  <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-zinc-200 bg-white p-1.5 text-zinc-400 lg:block">
                    <ArrowRight size={13} />
                  </div>
                )}
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
};

export default HowItWorksSection;