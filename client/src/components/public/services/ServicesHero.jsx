import { Sparkles } from "lucide-react";

import PublicHero from "../PublicHero";
import PublicButton from "../PublicButton";

const ServicesHero = () => {
  return (
    <PublicHero
      eyebrow="Our Services"
      eyebrowIcon={Sparkles}
      title="Work that moves"
      highlight="ideas forward."
      description="Explore focused marketing, public relations, and content services. Find the right starting point, then shape the details around your project."
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