import { ArrowUpRight, Sparkles } from "lucide-react";

import PublicHero from "../PublicHero";
import HomeHeroVisual from "../hero/HomeHeroVisual";
import PublicButton from "../PublicButton";

const HeroSection = () => {
  return (
    <PublicHero
      className="bg-white"
      eyebrow="Glow Ventures Client Platform"
      eyebrowIcon={Sparkles}
      title="Turn ideas into"
      highlight="content that moves."
      description="Discover content services, configure exactly what you need, place orders, and manage everything from one streamlined client platform."
      visual={<HomeHeroVisual />}
      actions={
        <>
          <PublicButton to="/services" variant="primary">
            Explore Services
          </PublicButton>

          <PublicButton to="/about" variant="secondary">
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