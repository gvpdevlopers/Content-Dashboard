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
    <div className="glow-contact-strip">
      <div>
        <h2>Prefer a direct line?</h2>
        <p>Reach out in the way that works best for you. We'd be glad to hear what you're working on.</p>
      </div>
      {contacts.map(({ label, value, href, icon: Icon }) => (
        <a key={label} href={href} className="group">
          <span className="glow-contact-icon"><Icon size={25} strokeWidth={1.7} aria-hidden="true" /></span>
          <span><span className="glow-contact-label">{label}</span><strong>{value}</strong></span>
          <ArrowUpRight size={16} className="glow-contact-arrow" aria-hidden="true" />
        </a>
      ))}
    </div>
    <p className="mt-7 text-center text-sm text-zinc-500">
      Already a client? <Link to="/login" className="font-semibold underline underline-offset-4">Sign in</Link> to manage your services and orders.
    </p>
  </Reveal>
);
export default ContactInfo;
