import Section from "../Section";
import Reveal from "../Reveal";

const AboutStory = () => (
  <Section className="bg-white !py-24 sm:!py-32 lg:!py-44">
    <Reveal className="mx-auto max-w-5xl text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
        A connected point of view
      </p>
      <h2 className="mt-7 text-4xl font-medium leading-[1.05] tracking-[-0.065em] text-zinc-950 sm:text-6xl lg:text-7xl">
        Good work happens when
        <br className="hidden sm:block" />{" "}
        <span className="text-zinc-400">every part moves together.</span>
      </h2>
      <p className="mx-auto mt-8 max-w-2xl text-sm leading-7 text-zinc-600 sm:mt-10 sm:text-lg sm:leading-8">
        Since 2017, we’ve brought marketing, public relations, and content
        production under one roof. We help businesses move from a clear idea to
        considered action—with consistency at every step.
      </p>
      <div className="mx-auto mt-12 flex max-w-xl items-center justify-center gap-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 sm:mt-16 sm:text-xs">
        <span>Think</span>
        <span className="h-px flex-1 bg-zinc-200" />
        <span>Make</span>
        <span className="h-px flex-1 bg-zinc-200" />
        <span>Grow</span>
      </div>
    </Reveal>
  </Section>
);

export default AboutStory;
