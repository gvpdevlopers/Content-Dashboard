import Section from "../Section";
import Reveal from "../Reveal";

const disciplines = [
  {
    number: "01",
    title: "Internet marketing",
    description:
      "Digital growth initiatives designed to connect brands with the right audiences.",
  },
  {
    number: "02",
    title: "Public relations",
    description:
      "Build visibility, credibility, and meaningful conversations around your brand.",
  },
  {
    number: "03",
    title: "Content production",
    description:
      "From scripting to production, create engaging content designed to capture attention.",
  },
];

const AboutEcosystem = () => (
  <Section className="bg-zinc-950 !py-20 text-white sm:!py-28 lg:!py-36">
    <div className="mx-auto max-w-6xl">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 sm:text-xs">
          What we bring together
        </p>
        <h2 className="mt-5 text-4xl font-medium leading-[0.98] tracking-[-0.065em] sm:text-6xl">
          Separate strengths.
          <br />
          <span className="text-zinc-500">Shared momentum.</span>
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-x-8 border-t border-white/20 sm:mt-20 md:grid-cols-3 md:divide-x md:divide-white/15">
        {disciplines.map((item, index) => (
          <Reveal key={item.number} delay={index * 0.07} y={16}>
            <article className="group min-h-64 border-b border-white/15 py-7 transition-colors hover:bg-white/[0.025] sm:py-9 md:border-b-0 md:px-6 md:first:pl-0 md:last:pr-0">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500">
                {item.number}
              </p>
              <h3 className="mt-10 max-w-xs text-2xl font-medium leading-tight tracking-[-0.05em] text-white transition-transform duration-300 group-hover:translate-x-1 sm:mt-14 sm:text-3xl">
                {item.title}
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
                {item.description}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  </Section>
);

export default AboutEcosystem;
