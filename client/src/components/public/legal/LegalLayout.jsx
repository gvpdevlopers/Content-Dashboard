import { Link } from "react-router-dom";

import {
  ArrowLeft,
  ArrowUpRight,
} from "lucide-react";

const LegalLayout = ({ children }) => {
  return (
    <div className="bg-white">
      <div
        className="
          mx-auto
          w-full
          max-w-[1080px]
          px-4
          py-8
          sm:px-6
          sm:py-10
          lg:px-8
          lg:py-12
        "
      >
        {/* =====================================================
            BACK LINK
        ====================================================== */}
        <Link
          to="/"
          className="
            group
            mb-6
            inline-flex
            items-center
            gap-2
            text-xs
            font-semibold
            text-zinc-500
            transition-all
            duration-300
            hover:-translate-x-0.5
            hover:text-zinc-950
            sm:mb-7
            sm:text-sm
          "
        >
          <ArrowLeft
            size={14}
            strokeWidth={1.8}
            className="
              transition-transform
              duration-300
              group-hover:-translate-x-0.5
            "
            aria-hidden="true"
          />

          <span>Back to Glow Ventures</span>
        </Link>

        {/* =====================================================
            LEGAL ARTICLE
        ====================================================== */}
        <article
          className="
            relative
            overflow-hidden
            rounded-[24px]
            border
            border-zinc-200/90
            bg-white
            p-5
            shadow-[0_8px_30px_rgba(24,24,27,0.035)]
            sm:rounded-[28px]
            sm:p-7
            lg:p-10
            xl:p-12
          "
        >
          {/* subtle top glow */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -right-32
              -top-32
              h-64
              w-64
              rounded-full
              bg-zinc-100/70
              blur-3xl
            "
          />

          <div className="relative">
            {children}
          </div>
        </article>

        {/* =====================================================
            CONTACT FOOTER
        ====================================================== */}
        <div
          className="
            mt-7
            flex
            flex-col
            gap-4
            border-t
            border-zinc-200
            pt-6
            sm:mt-8
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:gap-6
          "
        >
          <p
            className="
              max-w-xl
              text-xs
              leading-5
              text-zinc-400
            "
          >
            Questions about these policies can be directed to
            Glow Ventures through the contact page.
          </p>

          <Link
            to="/contact"
            className="
              group
              inline-flex
              shrink-0
              items-center
              gap-2
              text-sm
              font-semibold
              text-zinc-900
              transition-colors
              duration-300
              hover:text-zinc-500
            "
          >
            <span>Contact us</span>

            <span
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-full
                border
                border-zinc-200
                bg-white
                text-zinc-400
                transition-all
                duration-300
                group-hover:border-zinc-900
                group-hover:bg-zinc-900
                group-hover:text-white
              "
            >
              <ArrowUpRight
                size={13}
                strokeWidth={1.9}
                className="
                  transition-transform
                  duration-300
                  group-hover:-translate-y-0.5
                  group-hover:translate-x-0.5
                "
                aria-hidden="true"
              />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LegalLayout;