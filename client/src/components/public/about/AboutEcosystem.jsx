import Section from "../Section";
import Reveal from "../Reveal";
import HeadingCursor from "../HeadingCursor";

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
        <HeadingCursor as="h2" className="mt-5 text-4xl font-medium leading-[0.98] tracking-[-0.065em] sm:text-6xl">
          Three disciplines.
          <br />
          <span className="text-zinc-500">One connected direction.</span>
        </HeadingCursor>
      </Reveal>

      <div className="mt-12 border-t border-white/20 sm:mt-16">
        {disciplines.map((item, index) => (
          <Reveal key={item.number} delay={index * 0.05} y={14}>
            <article className="grid gap-3 border-b border-white/15 py-7 sm:grid-cols-[64px_minmax(0,0.9fr)_minmax(220px,0.7fr)] sm:items-center sm:gap-6 sm:py-9">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-500 sm:text-xs">
                {item.number}
              </p>
              <h3 className="break-words text-2xl font-medium leading-tight tracking-[-0.05em] text-white sm:text-3xl lg:text-4xl">
                {item.title}
              </h3>
              <p className="max-w-md text-sm leading-6 text-zinc-400 sm:text-base">
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
