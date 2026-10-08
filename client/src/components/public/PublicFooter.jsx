import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";

const navigation = [
  {
    title: "Explore",
    links: [
      { label: "Home", to: "/" },
      { label: "Services", to: "/services" },
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Client platform",
    links: [
      { label: "Login", to: "/login" },
      { label: "Explore services", to: "/services" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", to: "/privacy-policy" },
      { label: "Terms & conditions", to: "/terms-conditions" },
      { label: "Refund & cancellation", to: "/refund-cancellation" },
    ],
  },
];

const FooterLink = ({ to, children }) => (
  <li>
    <Link
      to={to}
      className="group inline-flex items-center gap-2 py-1 text-sm text-zinc-600 transition-colors duration-200 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-800/60"
    >
      <span>{children}</span>

      <ArrowUpRight
        size={13}
        className="opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
        aria-hidden="true"
      />
    </Link>
  </li>
);

const PublicFooter = () => {
  const reduceMotion = useReducedMotion();

  return (
  <footer className="relative isolate overflow-hidden bg-[#e8e7e3] text-zinc-950">
    {/* Subtle background detail */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute -right-48 -top-56 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.48),transparent_68%)]" />
    </div>

    <motion.p
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-16 z-0 overflow-hidden whitespace-nowrap text-center text-[clamp(3.25rem,14vw,12rem)] font-semibold leading-[0.8] tracking-[-0.09em] text-zinc-950/[0.035]"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: reduceMotion ? 0 : 0.7,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      GLOW VENTURES
    </motion.p>

    <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-10">
      {/* Main Footer */}
      <div className="grid gap-10 py-14 sm:py-16 lg:grid-cols-[1.35fr_repeat(4,minmax(0,1fr))] lg:gap-8 lg:py-20">
        {/* Brand */}
        <div className="max-w-xs">
          <Link
            to="/"
            aria-label="Glow Ventures home"
            className="group inline-flex rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-800/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#e8e7e3]"
          >
            <img
              src="/Logo.png"
              alt="Glow Ventures"
              className="h-9 w-auto object-contain transition-opacity duration-200 group-hover:opacity-70"
            />
          </Link>

          <p className="mt-4 text-sm leading-6 text-zinc-600">
            Marketing, public relations, and content - connected around your next move, bringing the right ideas, stories, and strategies together.
          </p>
        </div>

        {/* Navigation */}
        {navigation.map(({ title, links }) => (
          <nav key={title} aria-label={title}>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
              {title}
            </h3>

            <ul className="mt-4 space-y-1">
              {links.map(({ label, to }) => (
                <FooterLink key={`${label}-${to}`} to={to}>
                  {label}
                </FooterLink>
              ))}
            </ul>
          </nav>
        ))}

        {/* Contact */}
        <div className="sm:col-span-2 lg:col-span-1">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Get in touch
          </h3>

          <a
            href="mailto:team@glowventures.org"
            className="group mt-4 inline-flex items-center gap-2 break-all text-sm text-zinc-700 transition-colors hover:text-zinc-950"
          >
            team@glowventures.org

            <ArrowUpRight
              size={13}
              className="shrink-0 opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
              aria-hidden="true"
            />
          </a>

          <a
            href="tel:+919316876023"
            className="group mt-2 flex w-fit items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-950"
          >
            +91 9316876023

            <ArrowUpRight
              size={13}
              className="opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
              aria-hidden="true"
            />
          </a>

          <Link
            to="/login"
            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-zinc-900 transition-colors hover:text-zinc-600"
          >
            Access client platform

            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Copyright */}
      <div className="flex flex-col gap-3 border-t border-zinc-400/50 py-5 text-[11px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:py-6">
        <p>
          © {new Date().getFullYear()} Glow Ventures. All rights reserved.
        </p>

        <p className="tracking-wide">
          Strategy · Progress · Growth
        </p>
      </div>
    </div>
  </footer>
  );
};

export default PublicFooter;