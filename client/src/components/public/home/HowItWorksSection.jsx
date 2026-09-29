import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import Section from "../Section";
import Reveal from "../Reveal";

const steps = [
  {
    number: "01",
    title: "Find the fit",
    description: "Explore the service that meets your next objective.",
  },
  {
    number: "02",
    title: "Make it yours",
    description: "Choose options and tell us what your project needs.",
  },
  {
    number: "03",
    title: "Move forward",
    description: "Review your order and confirm the details securely.",
  },
  {
    number: "04",
    title: "Stay in the loop",
    description: "Track progress in one place through your client workspace.",
  },
];

const HowItWorksSection = () => (
  <Section className="bg-white !py-20 sm:!py-28 lg:!py-36">
    <div className="mx-auto max-w-6xl">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
          A clear process
        </p>
        <h2 className="mt-5 text-4xl font-semibold leading-[0.98] tracking-[-0.065em] text-zinc-950 sm:text-6xl">
          From first thought
          <br />
          <span className="text-zinc-400">to forward motion.</span>
        </h2>
      </Reveal>

      <ol className="relative mt-14 grid gap-0 sm:mt-20 md:grid-cols-4 md:before:absolute md:before:left-0 md:before:right-0 md:before:top-[15px] md:before:h-px md:before:bg-zinc-200">
        {steps.map((step, index) => (
          <Reveal key={step.number} delay={index * 0.06} className="relative">
            <li className="grid grid-cols-[32px_1fr] gap-4 border-l border-zinc-200 py-5 pl-5 md:block md:border-l-0 md:px-5 md:py-0 md:first:pl-0 md:last:pr-0">
              <span className="relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full border border-zinc-300 bg-white text-[9px] font-semibold tracking-wide text-zinc-700 md:mb-8">
                {step.number}
              </span>
              <div>
                <h3 className="text-lg font-semibold tracking-[-0.035em] text-zinc-900 sm:text-xl">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
                  {step.description}
                </p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>

      <Reveal className="mt-10 text-center sm:mt-14">
        <Link
          to="/services"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-zinc-800 transition-colors hover:text-zinc-500"
        >
          See what’s possible
          <ArrowUpRight
            size={16}
            className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </Reveal>
    </div>
  </Section>
);

export default HowItWorksSection;
