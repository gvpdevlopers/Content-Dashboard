import Section from "../Section";
import Reveal from "../Reveal";
import HeadingCursor from "../HeadingCursor";

const AboutStory = () => (
  <Section className="bg-white !py-20 sm:!py-28 lg:!py-36">
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
      <Reveal>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 sm:text-xs">
          Who we are
        </p>
        <HeadingCursor
          as="h2"
          className="mt-5 text-4xl font-medium leading-[0.98] tracking-[-0.065em] text-zinc-950 sm:text-6xl lg:text-7xl"
        >
          Like Steroids For
          <br />
          <span className="text-zinc-400">Your Business.</span>
        </HeadingCursor>
      </Reveal>

      <Reveal delay={0.08} className="lg:pt-12">
        <p className="text-base leading-7 text-zinc-800 sm:text-lg sm:leading-8">
          Glow Ventures is a marketing and public relations agency bringing
          Internet Marketing, Public Relations, and Content Production together
          around a clear business direction.
        </p>
        <p className="mt-5 text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
          Since 2017, our methods have been tested across hundreds of
          businesses. We connect strategy, stories, and execution so the work
          can move together—not as disconnected pieces.
        </p>
        <p className="mt-5 border-l-2 border-zinc-300 pl-4 text-sm leading-6 text-zinc-500">
          A connected approach, shaped by the goals of each business we work
          with.
        </p>
      </Reveal>
    </div>
  </Section>
);

export default AboutStory;
