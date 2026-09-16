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
    <header className="sticky top-0 z-50 border-b border-[var(--color-border-soft)] bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          onClick={closeMenu}
          className="flex shrink-0 items-center"
          aria-label="Glow Ventures home"
        >
          <img
            src="/Logo.png"
            alt="Glow Ventures"
            className="h-9 w-auto object-contain sm:h-10"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 lg:flex"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                [
                  "relative py-2 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:block">
          <PublicButton
            to="/login"
            variant="primary"
            className="min-h-[44px] px-5"
          >
            Login
          </PublicButton>
        </div>

        {/* Mobile Toggle */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] transition-all duration-300 hover:bg-[var(--color-surface-muted)] hover:shadow-sm lg:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-[var(--color-border-soft)] bg-white lg:hidden">
          <nav
            aria-label="Mobile navigation"
            className="mx-auto flex w-full max-w-[1400px] flex-col px-4 py-4 sm:px-6"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                onClick={closeMenu}
                className={({ isActive }) =>
                  [
                    "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--color-surface-muted)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)]",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}

            {/* Mobile CTA */}
            <PublicButton
              to="/login"
              variant="primary"
              onClick={closeMenu}
              className="mt-3 w-full rounded-xl"
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