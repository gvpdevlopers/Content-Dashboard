import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import Section from "../Section";
import Reveal from "../Reveal";

const process = [
  {
    number: "01",
    title: "Strategize",
    description:
      "Understand the opportunity, define the direction, and establish a clear plan.",
  },
  {
    number: "02",
    title: "Spark progress",
    description:
      "Put the plan into motion through focused marketing, communication, and content.",
  },
  {
    number: "03",
    title: "Drive growth",
    description:
      "Build momentum by refining the work around the business objective.",
  },
];

const AboutProcess = () => (
  <Section className="bg-[#f2f2f0] !py-20 sm:!py-28 lg:!py-36">
    <div className="mx-auto max-w-6xl">
      <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
            How we work
          </p>
          <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.065em] text-zinc-950 sm:text-6xl">
            Thoughtful at every step.
          </h2>
        </div>
        <Link
          to="/contact"
          className="group inline-flex w-fit items-center gap-2 pb-1 text-sm font-semibold text-zinc-800 transition-colors hover:text-zinc-500"
        >
          Start a conversation
          <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </Reveal>

      <ol className="mt-12 border-t border-zinc-300 sm:mt-16">
        {process.map((item, index) => (
          <Reveal key={item.number} delay={index * 0.06} y={14}>
            <li className="grid gap-3 border-b border-zinc-300 py-7 sm:grid-cols-[90px_minmax(0,0.85fr)_minmax(0,1fr)] sm:items-baseline sm:gap-6 sm:py-9">
              <span className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400 sm:text-xs">
                {item.number}
              </span>
              <h3 className="text-2xl font-medium tracking-[-0.05em] text-zinc-950 sm:text-3xl">
                {item.title}
              </h3>
              <p className="max-w-xl text-sm leading-6 text-zinc-600 sm:text-base">
                {item.description}
              </p>
            </li>
          </Reveal>
        ))}
      </ol>
    </div>
  </Section>
);

export default AboutProcess;
