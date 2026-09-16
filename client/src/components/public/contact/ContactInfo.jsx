import {
  ArrowUpRight,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";

import Reveal from "../Reveal";
import GradientText from "../GradientText";

const CONTACT_EMAIL = "team@glowventures.org";
const CONTACT_PHONE = "+91 9499555444";

const ContactInfo = () => {
  return (
    <Reveal>
      <div className="lg:sticky lg:top-32 lg:self-start">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
          Get in touch
        </p>

        <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-zinc-950 sm:text-4xl">
          Have a project
          <br />
          <GradientText>in mind?</GradientText>
        </h2>

        <p className="mt-5 max-w-md text-base leading-7 text-zinc-500">
          Whether you're exploring a service or looking to discuss a
          specific requirement, send us a message and we'll take it
          from there.
        </p>

        {/* Email Card */}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="
            group
            relative
            mt-8
            flex
            w-full
            max-w-md
            items-center
            gap-4
            overflow-hidden
            rounded-[22px]
            border
            border-zinc-200
            bg-zinc-50
            p-5
            shadow-[0_1px_2px_rgba(0,0,0,0.02)]
            transition-all
            duration-500
            ease-[cubic-bezier(0.22,1,0.36,1)]
            
            hover:border-zinc-300
            hover:bg-white
            hover:shadow-[0_18px_45px_rgba(24,24,27,0.08)]
          "
        >
          {/* Hover glow */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-10
              -top-10
              h-24
              w-24
              rounded-full
              bg-zinc-900/[0.04]
              blur-2xl
              opacity-0
              transition-opacity
              duration-700
              group-hover:opacity-100
            "
          />

          <div
            className="
              relative
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-white
              text-zinc-800
              shadow-sm
              transition-all
              duration-500
              ease-[cubic-bezier(0.22,1,0.36,1)]
              group-hover:bg-zinc-950
              group-hover:text-white
              group-hover:shadow-md
            "
          >
            <Mail
              size={19}
              strokeWidth={1.8}
              className="transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <div className="relative min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
              Email
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-zinc-900">
              {CONTACT_EMAIL}
            </p>
          </div>

          <ArrowUpRight
            size={17}
            className="
              relative
              shrink-0
              text-zinc-400
              transition-all
              duration-500
              ease-[cubic-bezier(0.22,1,0.36,1)]
              group-hover:-translate-y-0.5
              group-hover:translate-x-0.5
              group-hover:text-zinc-900
            "
          />
        </a>

        {/* Phone Card */}
        <a
          href="tel:+919499555444"
          className="
            group
            relative
            mt-3
            flex
            w-full
            max-w-md
            items-center
            gap-4
            overflow-hidden
            rounded-[22px]
            border
            border-zinc-200
            bg-zinc-50
            p-5
            shadow-[0_1px_2px_rgba(0,0,0,0.02)]
            transition-all
            duration-500
            ease-[cubic-bezier(0.22,1,0.36,1)]
            
            hover:border-zinc-300
            hover:bg-white
            hover:shadow-[0_18px_45px_rgba(24,24,27,0.08)]
          "
        >
          {/* Hover glow */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-10
              -top-10
              h-24
              w-24
              rounded-full
              bg-zinc-900/[0.04]
              blur-2xl
              opacity-0
              transition-opacity
              duration-700
              group-hover:opacity-100
            "
          />

          <div
            className="
              relative
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-white
              text-zinc-800
              shadow-sm
              transition-all
              duration-500
              ease-[cubic-bezier(0.22,1,0.36,1)]
              group-hover:bg-zinc-950
              group-hover:text-white
              group-hover:shadow-md
            "
          >
            <Phone
              size={19}
              strokeWidth={1.8}
              className="transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          <div className="relative min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
              Phone
            </p>

            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {CONTACT_PHONE}
            </p>
          </div>

          <ArrowUpRight
            size={17}
            className="
              relative
              shrink-0
              text-zinc-400
              transition-all
              duration-500
              ease-[cubic-bezier(0.22,1,0.36,1)]
              group-hover:-translate-y-0.5
              group-hover:translate-x-0.5
              group-hover:text-zinc-900
            "
          />
        </a>

        <div className="mt-8 flex items-start gap-3 text-sm leading-6 text-zinc-500">
          <Sparkles
            size={16}
            className="mt-0.5 shrink-0 text-zinc-400"
          />

          <p>
            For existing clients, you can also use the client
            platform to manage services and orders.
          </p>
        </div>
      </div>
    </Reveal>
  );
};

export default ContactInfo;