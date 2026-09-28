import { ArrowUpRight, CheckCircle2, Layers3, Sparkles } from "lucide-react";

import PublicHero from "../PublicHero";
import PublicButton from "../PublicButton";

const HeroSection = () => {
  return (
    <PublicHero
      className="bg-white"
      eyebrow="Glow Ventures Client Platform"
      eyebrowIcon={Sparkles}
      title="Like Steroids for"
      highlight="Your Business."
      description="Discover content services, configure exactly what you need, place orders, and manage everything from one streamlined client platform."
      visual={
        <div className="relative rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_22px_65px_rgba(24,24,27,0.08)] sm:p-7">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                <Layers3 size={18} />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                  Client workspace
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  Project overview
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              On track
            </span>
          </div>
          <div className="py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  Content production
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Brief, configure, and follow your order in one place.
                </p>
              </div>
              <CheckCircle2
                size={20}
                className="shrink-0 text-emerald-600"
              />
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full w-2/3 rounded-full bg-zinc-800" />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-zinc-400">
              <span>Order progress</span>
              <span>2 of 3 steps</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
            <p className="text-xs text-zinc-500">
              One clear view from request to delivery
            </p>
            <ArrowUpRight size={16} className="text-zinc-500" />
          </div>
        </div>
      }
      actions={
        <>
          <PublicButton to="/services" variant="primary">
            Explore Services
          </PublicButton>

          <PublicButton
  href="https://www.glowventures.org/"
  variant="secondary"
  target="_blank"
  rel="noopener noreferrer"
>
  Discover Glow Ventures
</PublicButton>
        </>
      }
      meta={
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-[var(--color-text-subtle)] sm:text-sm">
          <span>Clear service options</span>

          <span className="hidden h-1 w-1 rounded-full bg-[var(--color-border-strong)] sm:block" />

          <span>Transparent ordering</span>

          <span className="hidden h-1 w-1 rounded-full bg-[var(--color-border-strong)] sm:block" />

          <span>Centralized order tracking</span>
        </div>
      }
    />
  );
};

export default HeroSection;