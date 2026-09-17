import { useState } from "react";

import { Link, NavLink } from "react-router-dom";

import { Menu, X } from "lucide-react";

import PublicButton from "./PublicButton";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/services" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

const PublicHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className="
        sticky
        top-0
        z-50
        border-b
        border-[var(--color-border-soft)]
        bg-white/90
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          flex
          h-[72px]
          w-full
          max-w-[1400px]
          items-center
          justify-between
          px-4
          sm:px-6
          lg:px-8
        "
      >
        {/* =====================================================
            LOGO
        ====================================================== */}
        <Link
          to="/"
          onClick={closeMenu}
          className="
            group
            flex
            shrink-0
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
              h-10
              w-auto
              object-contain
              transition-transform
              duration-500
              ease-[cubic-bezier(0.22,1,0.36,1)]
              group-hover:scale-[1.02]
              sm:h-11
            "
          />
        </Link>

        {/* =====================================================
            DESKTOP NAVIGATION
        ====================================================== */}
        <nav
          aria-label="Primary navigation"
          className="
            hidden
            items-center
            gap-7
            lg:flex
          "
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                [
                  `
                    group
                    relative
                    flex
                    h-[72px]
                    items-center
                    px-1
                    text-sm
                    font-medium
                    outline-none
                    transition-colors
                    duration-300
                  `,
                  "focus-visible:text-zinc-950",

                  isActive
                    ? "text-zinc-950"
                    : "text-[var(--color-text-muted)] hover:text-zinc-950",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    {item.label}

                    {/* Active / hover indicator */}
                    <span
                      aria-hidden="true"
                      className={`
                        absolute
                        -bottom-2
                        left-1/2
                        h-[2px]
                        -translate-x-1/2
                        rounded-full
                        bg-zinc-950
                        transition-all
                        duration-300
                        ease-[cubic-bezier(0.22,1,0.36,1)]
                        ${
                          isActive
                            ? "w-5 opacity-100"
                            : "w-0 opacity-0 group-hover:w-5 group-hover:opacity-40"
                        }
                      `}
                    />
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* =====================================================
            DESKTOP CTA
        ====================================================== */}
        <div className="hidden lg:block">
          <PublicButton
            to="/login"
            variant="primary"
            className="
              min-h-[40px]
              rounded-full
              px-4
              text-xs
              sm:px-[18px]
            "
          >
            Login
          </PublicButton>
        </div>

        {/* =====================================================
            MOBILE TOGGLE
        ====================================================== */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="
            focus-ring
            inline-flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            border
            border-[var(--color-border)]
            bg-white
            text-[var(--color-text-primary)]
            transition-all
            duration-300
            hover:bg-[var(--color-surface-muted)]
            hover:shadow-sm
            lg:hidden
          "
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <X size={20} strokeWidth={1.8} />
          ) : (
            <Menu size={20} strokeWidth={1.8} />
          )}
        </button>
      </div>

      {/* =====================================================
          MOBILE NAVIGATION
      ====================================================== */}
      {isMenuOpen && (
        <div
          className="
            border-t
            border-[var(--color-border-soft)]
            bg-white
            lg:hidden
          "
        >
          <nav
            aria-label="Mobile navigation"
            className="
              mx-auto
              flex
              w-full
              max-w-[1400px]
              flex-col
              px-4
              py-3
              sm:px-6
            "
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={closeMenu}
                className={({ isActive }) =>
                  [
                    `
                      group
                      relative
                      flex
                      items-center
                      justify-between
                      rounded-xl
                      border
                      px-4
                      py-2.5
                      text-sm
                      font-medium
                      transition-all
                      duration-300
                    `,
                    isActive
                      ? "border-zinc-200 bg-zinc-50 text-zinc-950 shadow-[0_2px_8px_rgba(0,0,0,0.025)]"
                      : "border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)] hover:text-zinc-950",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>

                    {/* Active mobile indicator */}
                    <span
                      aria-hidden="true"
                      className={`
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-zinc-950
                        transition-all
                        duration-300
                        ${
                          isActive
                            ? "scale-100 opacity-100"
                            : "scale-0 opacity-0"
                        }
                      `}
                    />
                  </>
                )}
              </NavLink>
            ))}

            {/* Mobile CTA */}
            <PublicButton
              to="/login"
              variant="primary"
              onClick={closeMenu}
              className="
                mt-2
                w-full
                rounded-xl
                py-2.5
                text-sm
              "
            >
              Login
            </PublicButton>
          </nav>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;