import { ArrowUpRight, Megaphone, PenTool, Video } from "lucide-react";

import Section from "../Section";
import SectionHeading from "../SectionHeading";
import Reveal from "../Reveal";
import Stagger, { StaggerItem } from "../Stagger";

const ecosystem = [
  {
    title: "Internet Marketing",
    description:
      "Digital growth initiatives designed to connect brands with the right audiences.",
    icon: Megaphone,
    className: "from-cyan-50 to-white",
  },
  {
    title: "Public Relations",
    description:
      "Build visibility, credibility, and meaningful conversations around your brand.",
    icon: PenTool,
    className: "from-blue-50 to-white",
  },
  {
    title: "Content Production",
    description:
      "From scripting to production, create engaging content designed to capture attention.",
    icon: Video,
    className: "from-violet-50 to-white",
  },
];

const EcosystemSection = () => {
  return (
    <Section className="bg-[var(--color-surface-soft)]">
      <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
        <Reveal>
          <SectionHeading
            eyebrow="The ecosystem"
            title="More than a service."
            description="Glow Ventures brings strategy, growth, communication, and content together into one broader ecosystem."
          />
        </Reveal>

        <Stagger className="grid gap-4">
          {ecosystem.map((item) => {
            const Icon = item.icon;

            return (
              <StaggerItem key={item.title}>
                <div
                  className={`group relative overflow-hidden rounded-[26px] border border-[var(--color-border)] bg-gradient-to-br ${item.className} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(24,24,27,0.08)] sm:p-8`}
                >
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-800 shadow-sm">
                        <Icon size={20} />
                      </div>

                      <div>
                        <h3 className="text-xl font-bold tracking-[-0.025em] text-zinc-900">
                          {item.title}
                        </h3>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-transform duration-300 group-hover:rotate-45">
                      <ArrowUpRight size={17} />
                    </div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </Section>
  );
};

export default EcosystemSection;