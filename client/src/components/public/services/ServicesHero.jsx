import { Sparkles } from "lucide-react";

import PublicHero from "../PublicHero";
import ServicesHeroVisual from "../hero/ServicesHeroVisual";
import PublicButton from "../PublicButton";

const ServicesHero = () => {
  return (
    <PublicHero
      eyebrow="Our Services"
      eyebrowIcon={Sparkles}
      title="Services that turn"
      highlight="ideas into action."
      description="Explore the services available through the Glow Ventures platform. Choose what fits your project and configure your requirements when you're ready to order."
      visual={<ServicesHeroVisual />}
      actions={
        <>
          <PublicButton to="/login" variant="primary">
            Start an Order
          </PublicButton>

          <PublicButton to="/contact" variant="secondary">
            Talk to Us
          </PublicButton>
        </>
      }
    />
  );
};

export default ServicesHero;