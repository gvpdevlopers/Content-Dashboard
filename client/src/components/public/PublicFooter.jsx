import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const PublicFooter = () => {
  return (
    <footer className="border-t border-[var(--color-border)] bg-white">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <Link to="/" className="inline-flex">
              <img
                src="/Logo.png"
                alt="Glow Ventures"
                className="h-10 w-auto object-contain"
              />
            </Link>

            <p className="mt-5 text-sm leading-7 text-[var(--color-text-muted)]">
              Content and digital services delivered through a streamlined
              client experience.
            </p>

            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-text-secondary)]"
            >
              Access Client Platform
              <ArrowUpRight size={15} />
            </Link>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Company
            </h3>

            <ul className="mt-5 space-y-3">
              <li>
                <Link
                  to="/about"
                  className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  About
                </Link>
              </li>

              <li>
                <Link
                  to="/services"
                  className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  Services
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Platform
            </h3>

            <ul className="mt-5 space-y-3">
              <li>
                <Link
                  to="/login"
                  className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  Login
                </Link>
              </li>

              <li>
                <Link
                  to="/services"
                  className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  Explore Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              Legal
            </h3>

            <ul className="mt-5 space-y-3">
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  to="/terms-conditions"
                  className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  Terms & Conditions
                </Link>
              </li>

              <li>
                <Link
                  to="/refund-cancellation"
                  className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  Refund & Cancellation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--color-border-soft)] pt-6">
          <p className="text-xs text-[var(--color-text-subtle)]">
            © {new Date().getFullYear()} Glow Ventures. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;