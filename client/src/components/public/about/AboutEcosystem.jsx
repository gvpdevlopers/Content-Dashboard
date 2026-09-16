import {
  ArrowUpRight,
  Megaphone,
  PenTool,
  Video,
} from "lucide-react";

import Section from "../Section";
import SectionHeading from "../SectionHeading";
import Reveal from "../Reveal";
import Stagger, { StaggerItem } from "../Stagger";

const ecosystem = [
  {
    title: "Internet Marketing",
    description:
      "Digital marketing across channels such as Meta, Google, and native advertising.",
    icon: Megaphone,
  },
  {
    title: "Public Relations",
    description:
      "Build awareness through media coverage, communications, and influencer outreach.",
    icon: PenTool,
  },
  {
    title: "Content Production",
    description:
      "Develop engaging content from scripting through production.",
    icon: Video,
  },
];

const AboutEcosystem = () => {
  return (
    <Section className="bg-white">
      <Reveal>
        <SectionHeading
          eyebrow="Our ecosystem"
          title="Different disciplines."
          highlight="One direction."
          description="Glow Ventures brings multiple areas of marketing and communication together as part of a broader growth ecosystem."
        />
      </Reveal>

      <Stagger className="mt-12 grid gap-5 md:grid-cols-3">
        {ecosystem.map((item) => {
          const Icon = item.icon;

          return (
            <StaggerItem key={item.title}>
              <article className="group h-full rounded-[26px] border border-zinc-200 bg-zinc-50 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_25px_60px_rgba(24,24,27,0.08)] sm:p-8">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-800 shadow-sm transition-all duration-300 group-hover:bg-zinc-950 group-hover:text-white">
                    <Icon size={20} />
                  </div>

                  <ArrowUpRight
                    size={18}
                    className="text-zinc-400 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-zinc-900"
                  />
                </div>

                <h3 className="mt-8 text-xl font-bold tracking-[-0.025em] text-zinc-950">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  {item.description}
                </p>
              </article>
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
};

export default AboutEcosystem;