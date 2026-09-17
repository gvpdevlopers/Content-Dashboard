import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";

const companyLinks = [
  {
    label: "About",
    to: "/about",
  },
  {
    label: "Services",
    to: "/services",
  },
  {
    label: "Contact",
    to: "/contact",
  },
];

const platformLinks = [
  {
    label: "Login",
    to: "/login",
  },
  {
    label: "Explore Services",
    to: "/services",
  },
];

const legalLinks = [
  {
    label: "Privacy Policy",
    to: "/privacy-policy",
  },
  {
    label: "Terms & Conditions",
    to: "/terms-conditions",
  },
  {
    label: "Refund & Cancellation",
    to: "/refund-cancellation",
  },
];

const FooterLink = ({ to, children }) => {
  return (
    <li>
      <Link
        to={to}
        className="
          group
          inline-flex
          items-center
          gap-1.5
          text-sm
          font-medium
          text-[var(--color-text-muted)]
          transition-all
          duration-300
          hover:translate-x-0.5
          hover:text-[var(--color-text-primary)]
        "
      >
        <span>{children}</span>

        <ArrowUpRight
          size={12}
          strokeWidth={1.8}
          className="
            -translate-x-1
            opacity-0
            transition-all
            duration-300
            group-hover:translate-x-0
            group-hover:opacity-100
          "
          aria-hidden="true"
        />
      </Link>
    </li>
  );
};

const FooterColumn = ({ title, links }) => {
  return (
    <div>
      <h3
        className="
          text-xs
          font-bold
          uppercase
          tracking-[0.12em]
          text-[var(--color-text-primary)]
        "
      >
        {title}
      </h3>

      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <FooterLink
            key={link.to}
            to={link.to}
          >
            {link.label}
          </FooterLink>
        ))}
      </ul>
    </div>
  );
};

const PublicFooter = () => {
  return (
    <footer
      className="
        relative
        overflow-hidden
        border-t
        border-[var(--color-border)]
        bg-white
      "
    >
      {/* =====================================================
          SUBTLE AMBIENT BACKGROUND
      ====================================================== */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-32
          -top-32
          h-72
          w-72
          rounded-full
          bg-zinc-100/70
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-40
          left-1/4
          h-64
          w-64
          rounded-full
          bg-zinc-100/50
          blur-3xl
        "
      />

      <div
        className="
          relative
          mx-auto
          w-full
          max-w-[1400px]
          px-4
          py-10
          sm:px-6
          sm:py-12
          lg:px-8
          lg:py-14
        "
      >
        {/* =====================================================
            MAIN FOOTER
        ====================================================== */}
        <div
          className="
            grid
            gap-8
            sm:grid-cols-2
            lg:grid-cols-[1.7fr_1fr_1fr_1fr]
            lg:gap-10
            xl:gap-14
          "
        >
          {/* =================================================
              BRAND
          ================================================== */}
          <div className="max-w-md">
            <Link
              to="/"
              className="
                group
                inline-flex
                items-center
                rounded-lg
                outline-none
                transition-transform
                duration-300
                hover:-translate-y-0.5
                focus-visible:ring-2
                focus-visible:ring-zinc-900
                focus-visible:ring-offset-4
              "
              aria-label="Glow Ventures home"
            >
              <img
                src="/Logo.png"
                alt="Glow Ventures"
                className="
                  h-9
                  w-auto
                  object-contain
                  transition-transform
                  duration-500
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  group-hover:scale-[1.02]
                "
              />
            </Link>

            <p
              className="
                mt-4
                max-w-sm
                text-sm
                leading-6
                text-[var(--color-text-muted)]
                sm:mt-5
              "
            >
              Content and digital services delivered through a
              streamlined client experience.
            </p>

            {/* Client platform link */}
            <Link
              to="/login"
              className="
                group
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-zinc-200
                bg-zinc-50
                px-4
                py-2.5
                text-xs
                font-semibold
                text-zinc-900
                shadow-[0_2px_8px_rgba(0,0,0,0.025)]
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:border-zinc-300
                hover:bg-white
                hover:shadow-[0_10px_25px_rgba(24,24,27,0.07)]
              "
            >
              <span>Access Client Platform</span>

              <span
                className="
                  flex
                  h-5
                  w-5
                  items-center
                  justify-center
                  rounded-full
                  bg-zinc-900
                  text-white
                  transition-transform
                  duration-300
                  group-hover:translate-x-0.5
                  group-hover:-translate-y-0.5
                "
              >
                <ArrowUpRight
                  size={11}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </span>
            </Link>
          </div>

          {/* =================================================
              COMPANY
          ================================================== */}
          <FooterColumn
            title="Company"
            links={companyLinks}
          />

          {/* =================================================
              PLATFORM
          ================================================== */}
          <FooterColumn
            title="Platform"
            links={platformLinks}
          />

          {/* =================================================
              LEGAL
          ================================================== */}
          <FooterColumn
            title="Legal"
            links={legalLinks}
          />
        </div>

        {/* =====================================================
            BOTTOM BAR
        ====================================================== */}
        <div
          className="
            mt-8
            border-t
            border-[var(--color-border-soft)]
            pt-5
            sm:mt-10
            sm:pt-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <p
              className="
                text-[11px]
                font-medium
                text-[var(--color-text-subtle)]
              "
            >
              © {new Date().getFullYear()} Glow Ventures. All rights
              reserved.
            </p>

            <div
              className="
                flex
                items-center
                gap-1.5
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.1em]
                text-zinc-400
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-zinc-300
                "
                aria-hidden="true"
              />

              <span>Client-first digital experience</span>

              <ChevronRight
                size={11}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;