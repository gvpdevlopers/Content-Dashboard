
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import PublicDarkCTA from "../PublicDarkCTA";

const AboutCTA = () => (
  <PublicDarkCTA
    eyebrow="Good work begins with a conversation"
    title="Have a good idea?"
    highlight="Let’s give it momentum."
  >
    <Link
      to="/contact"
      className="
        group inline-flex min-h-12 items-center gap-3 rounded-full
        bg-white px-6 py-3 text-sm font-semibold text-zinc-950

        transition-all duration-700 ease-in-out
        hover:bg-zinc-100
        hover:shadow-[0_8px_30px_rgba(255,255,255,0.10)]

        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-white/70
        focus-visible:ring-offset-2
        focus-visible:ring-offset-zinc-950

        active:scale-[0.99]
      "
    >
      <span
        className="
          text-zinc-950
          transition-all duration-700 ease-in-out
          group-hover:translate-x-0.5
        "
      >
        Talk to our team
      </span>

      <ArrowUpRight
        size={16}
        aria-hidden="true"
        className="
          text-zinc-950
          transition-transform duration-700 ease-in-out
          group-hover:-translate-y-0.5
          group-hover:translate-x-0.5
        "
      />
    </Link>
  </PublicDarkCTA>
);

export default AboutCTA;
