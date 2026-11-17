import { ArrowUpRight, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import Reveal from "../Reveal";

const contacts = [
  {
    label: "Email",
    value: "team@glowventures.org",
    href: "mailto:team@glowventures.org",
    icon: Mail,
  },
  {
    label: "Phone",
    value: "+91 9316876023",
    href: "tel:+919316876023",
    icon: Phone,
  },
];

const ContactInfo = () => (
  <Reveal>
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 sm:text-xs">
        Prefer a direct line?
      </p>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
        Reach out in the way that works best for you. We’d be glad to hear what
        you’re working on.
      </p>

      <div className="mt-8 grid border-y border-zinc-200 sm:grid-cols-2 sm:divide-x sm:divide-zinc-200">
        {contacts.map(({ label, value, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            className="group flex min-w-0 items-center justify-between gap-3 border-b border-zinc-200 py-4 text-left transition-colors hover:text-zinc-500 last:border-b-0 sm:px-5 sm:py-5 sm:first:pl-0 sm:last:pr-0 sm:border-b-0"
          >
            <span className="flex min-w-0 items-center gap-3">
              <Icon size={17} strokeWidth={1.7} className="shrink-0 text-zinc-400" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-400">
                  {label}
                </span>
                <span className="mt-1 block break-words text-sm font-semibold text-zinc-900 sm:text-base">
                  {value}
                </span>
              </span>
            </span>
            <ArrowUpRight
              size={15}
              className="shrink-0 text-zinc-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>
        ))}
      </div>
      <p className="mt-5 text-xs text-zinc-500">
        Already a client?{" "}
        <Link
          to="/login"
          className="font-semibold text-zinc-800 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-500"
        >
          Sign in
        </Link>{" "}
        to manage your services and orders.
      </p>
    </div>
  </Reveal>
);

export default ContactInfo;
