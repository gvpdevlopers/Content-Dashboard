import HeroSection from "../components/public/home/HeroSection";
import IntroSection from "../components/public/home/IntroSection";
import ServicesSection from "../components/public/home/ServicesSection";
import HowItWorksSection from "../components/public/home/HowItWorksSection";
import EcosystemSection from "../components/public/home/EcosystemSection";
import WhyGlowSection from "../components/public/home/WhyGlowSection";
import PlatformCTA from "../components/public/home/PlatformCTA";
import FinalCTA from "../components/public/home/FinalCTA";

const Home = () => {
  return (
    <>
      <HeroSection />
      <IntroSection />
      <ServicesSection />
      <HowItWorksSection />
      <EcosystemSection />
      <WhyGlowSection />
      <PlatformCTA />
      <FinalCTA />
    </>
  );
};

export default Home;