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
        {/* =====================================================
            INTRO
        ====================================================== */}
        <div className="max-w-xl">
          {/* Capsule */}
          <div
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-full
              border
              border-zinc-200/80
              bg-zinc-50/80
              px-3
              py-1.5
              text-[11px]
              font-semibold
              tracking-[0.11em]
              text-zinc-500
              shadow-[0_2px_8px_rgba(0,0,0,0.035)]
              backdrop-blur-md
              sm:gap-2
              sm:px-3.5
              sm:text-xs
            "
          >
            <Sparkles
              size={13}
              strokeWidth={1.7}
              aria-hidden="true"
            />

            <span>Get in touch</span>
          </div>

          <h2
            className="
              mt-5
              max-w-xl
              text-3xl
              font-bold
              leading-[1.02]
              tracking-[-0.045em]
              text-zinc-950
              sm:mt-6
              sm:text-4xl
              lg:text-5xl
              xl:text-[3.45rem]
            "
          >
            Have a project{" "}
            <GradientText>in mind?</GradientText>
          </h2>

          <p
            className="
              mt-5
              max-w-lg
              text-base
              leading-7
              text-zinc-500
              sm:mt-6
              sm:text-lg
              sm:leading-8
            "
          >
            Whether you're exploring a service or have a specific
            requirement in mind, tell us what you're building and
            we'll take it from there.
          </p>
        </div>

        {/* =====================================================
            CONTACT CARDS
        ====================================================== */}
        <div className="mt-7 max-w-xl sm:mt-8">
          {/* Email */}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="
              group
              relative
              flex
              w-full
              items-center
              gap-4
              overflow-hidden
              rounded-[22px]
              border
              border-zinc-200/90
              bg-white
              p-5
              shadow-[0_4px_18px_rgba(24,24,27,0.025)]
              transition-all
              duration-500
              ease-[cubic-bezier(0.22,1,0.36,1)]
              hover:-translate-y-1
              hover:border-zinc-300
              hover:shadow-[0_18px_45px_rgba(24,24,27,0.08)]
            "
          >
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -right-12
                -top-12
                h-28
                w-28
                rounded-full
                bg-zinc-200/50
                opacity-0
                blur-3xl
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
                rounded-2xl
                border
                border-zinc-200
                bg-zinc-50
                text-zinc-600
                shadow-[0_2px_8px_rgba(0,0,0,0.025)]
                transition-all
                duration-500
                ease-[cubic-bezier(0.22,1,0.36,1)]
                group-hover:border-zinc-950
                group-hover:bg-zinc-950
                group-hover:text-white
                group-hover:shadow-[0_10px_24px_rgba(24,24,27,0.14)]
              "
            >
              <Mail
                size={18}
                strokeWidth={1.8}
                className="
                  transition-transform
                  duration-500
                  group-hover:scale-105
                "
              />
            </div>

            <div className="relative min-w-0 flex-1">
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-zinc-400
                "
              >
                Email
              </p>

              <p
                className="
                  mt-1
                  truncate
                  text-sm
                  font-semibold
                  text-zinc-900
                "
              >
                {CONTACT_EMAIL}
              </p>
            </div>

            <ArrowUpRight
              size={17}
              strokeWidth={1.8}
              className="
                relative
                shrink-0
                text-zinc-300
                transition-all
                duration-500
                ease-[cubic-bezier(0.22,1,0.36,1)]
                group-hover:-translate-y-0.5
                group-hover:translate-x-0.5
                group-hover:text-zinc-900
              "
              aria-hidden="true"
            />

            <div
              aria-hidden="true"
              className="
                absolute
                inset-x-5
                bottom-0
                h-px
                origin-left
                scale-x-0
                bg-gradient-to-r
                from-zinc-900
                via-zinc-500
                to-transparent
                transition-transform
                duration-700
                ease-[cubic-bezier(0.22,1,0.36,1)]
                group-hover:scale-x-100
              "
            />
          </a>

          {/* Phone */}
          <a
            href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}
            className="
              group
              relative
              mt-3
              flex
              w-full
              items-center
              gap-4
              overflow-hidden
              rounded-[22px]
              border
              border-zinc-200/90
              bg-white
              p-5
              shadow-[0_4px_18px_rgba(24,24,27,0.025)]
              transition-all
              duration-500
              ease-[cubic-bezier(0.22,1,0.36,1)]
              hover:-translate-y-1
              hover:border-zinc-300
              hover:shadow-[0_18px_45px_rgba(24,24,27,0.08)]
            "
          >
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -right-12
                -top-12
                h-28
                w-28
                rounded-full
                bg-zinc-200/50
                opacity-0
                blur-3xl
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
                rounded-2xl
                border
                border-zinc-200
                bg-zinc-50
                text-zinc-600
                shadow-[0_2px_8px_rgba(0,0,0,0.025)]
                transition-all
                duration-500
                ease-[cubic-bezier(0.22,1,0.36,1)]
                group-hover:border-zinc-950
                group-hover:bg-zinc-950
                group-hover:text-white
                group-hover:shadow-[0_10px_24px_rgba(24,24,27,0.14)]
              "
            >
              <Phone
                size={18}
                strokeWidth={1.8}
                className="
                  transition-transform
                  duration-500
                  group-hover:scale-105
                "
              />
            </div>

            <div className="relative min-w-0 flex-1">
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.14em]
                  text-zinc-400
                "
              >
                Phone
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-zinc-900
                "
              >
                {CONTACT_PHONE}
              </p>
            </div>

            <ArrowUpRight
              size={17}
              strokeWidth={1.8}
              className="
                relative
                shrink-0
                text-zinc-300
                transition-all
                duration-500
                ease-[cubic-bezier(0.22,1,0.36,1)]
                group-hover:-translate-y-0.5
                group-hover:translate-x-0.5
                group-hover:text-zinc-900
              "
              aria-hidden="true"
            />

            <div
              aria-hidden="true"
              className="
                absolute
                inset-x-5
                bottom-0
                h-px
                origin-left
                scale-x-0
                bg-gradient-to-r
                from-zinc-900
                via-zinc-500
                to-transparent
                transition-transform
                duration-700
                ease-[cubic-bezier(0.22,1,0.36,1)]
                group-hover:scale-x-100
              "
            />
          </a>
        </div>

        {/* =====================================================
            CLIENT NOTE
        ====================================================== */}
        <div
          className="
            mt-7
            flex
            max-w-xl
            items-start
            gap-3
            rounded-[18px]
            border
            border-zinc-200/70
            bg-white/60
            px-4
            py-4
            text-sm
            leading-6
            text-zinc-500
            sm:mt-8
            sm:px-5
          "
        >
          <Sparkles
            size={16}
            strokeWidth={1.7}
            className="mt-0.5 shrink-0 text-zinc-400"
            aria-hidden="true"
          />

          <p>
            Already a client? Use the client platform to manage
            your services, requirements, and orders from one place.
          </p>
        </div>
      </div>
    </Reveal>
  );
};

export default ContactInfo;