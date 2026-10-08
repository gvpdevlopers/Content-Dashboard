import { Sparkles } from "lucide-react";

import PublicHero from "../PublicHero";
import PublicButton from "../PublicButton";

const ServicesHero = () => {
  return (
    <PublicHero
      eyebrow="Our Services"
      eyebrowIcon={Sparkles}
      title="Ideas deserve"
      highlight="forward motion."
      description="Explore Internet Marketing, Public Relations, and Content Production—connected around your goals and configured from our current service offering."
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