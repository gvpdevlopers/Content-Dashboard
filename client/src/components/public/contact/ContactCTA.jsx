import { LayoutDashboard } from "lucide-react";

import Section from "../Section";
import Reveal from "../Reveal";
import GradientText from "../GradientText";
import PublicButton from "../PublicButton";

const ContactCTA = () => {
  return (
    <Section className="bg-[var(--color-surface-soft)]">
      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] bg-zinc-950 px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-16 lg:py-18">
          {/* Background */}
          <div
            aria-hidden="true"
            className="public-ambient-glow absolute -right-20 -top-32 h-80 w-80 bg-white/10"
          />

          <div
            aria-hidden="true"
            className="public-ambient-glow absolute -bottom-40 left-1/3 h-96 w-96 bg-zinc-400/10"
          />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-300">
                <LayoutDashboard size={14} />
                Already a client?
              </div>

              <h2 className="mt-5 text-3xl font-bold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Manage your work from
                <br />
                <GradientText>one platform.</GradientText>
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                Sign in to explore services, create orders, and keep your work
                organized.
              </p>
            </div>

            <PublicButton to="/login" variant="secondary">
              Login
            </PublicButton>
          </div>
        </div>
      </Reveal>
    </Section>
  );
};

export default ContactCTA;