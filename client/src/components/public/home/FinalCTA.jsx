import Section from "../Section";
import Reveal from "../Reveal";
import GradientText from "../GradientText";
import PublicButton from "../PublicButton";

const FinalCTA = () => {
  return (
    <Section className="overflow-hidden bg-white pb-20 sm:pb-24 lg:pb-28">
      <Reveal>
        <div className="relative mx-auto max-w-4xl text-center">
          <div
            aria-hidden="true"
            className="public-ambient-glow absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 bg-zinc-900/10"
          />

          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Ready when you are
            </p>

            <h2 className="mt-5 text-3xl font-bold tracking-[-0.045em] text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
              Let’s create something
              <br />
              <GradientText>worth talking about.</GradientText>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)] sm:text-base sm:leading-7">
              Explore our services or connect with the Glow Ventures team to
              take the next step.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <PublicButton to="/services" variant="primary">
                Explore Services
              </PublicButton>

              <PublicButton to="/contact" variant="secondary">
                Contact Glow Ventures
              </PublicButton>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
};

export default FinalCTA;