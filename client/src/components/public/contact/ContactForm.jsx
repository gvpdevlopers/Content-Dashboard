import { useState } from "react";

import { CheckCircle2 } from "lucide-react";

import Reveal from "../Reveal";
import PublicButton from "../PublicButton";

const CONTACT_EMAIL = "team@glowventures.org";

const ContactForm = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const company = formData.get("company")?.toString().trim();
    const message = formData.get("message")?.toString().trim();

    const subject = company
      ? `Website enquiry from ${name} - ${company}`
      : `Website enquiry from ${name}`;

    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : "",
      "",
      "Message:",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const mailtoUrl =
      `mailto:${CONTACT_EMAIL}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;

    setSubmitted(true);
  };

  return (
    <Reveal delay={0.1}>
      <div className="rounded-[30px] border border-zinc-200 bg-zinc-50 p-5 sm:p-7 lg:p-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">
            Send an enquiry
          </p>

          <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-zinc-950 sm:text-3xl">
            Tell us what you're working on.
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Share a few details and we'll have the right context to
            continue the conversation.
          </p>
        </div>

        {submitted && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-emerald-600"
            />

            <p className="text-sm leading-6 text-emerald-700">
              Your email client should now be open with the enquiry
              prepared. If it didn't open, please email us directly.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="contact-name"
                className="mb-2 block text-sm font-semibold text-zinc-800"
              >
                Name
              </label>

              <input
                id="contact-name"
                name="name"
                type="text"
                required
                placeholder="Your name"
                className="focus-ring h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
              />
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="mb-2 block text-sm font-semibold text-zinc-800"
              >
                Email
              </label>

              <input
                id="contact-email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="focus-ring h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="contact-company"
              className="mb-2 block text-sm font-semibold text-zinc-800"
            >
              Company
              <span className="ml-1 font-normal text-zinc-400">
                (optional)
              </span>
            </label>

            <input
              id="contact-company"
              name="company"
              type="text"
              placeholder="Company name"
              className="focus-ring h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
            />
          </div>

          <div>
            <label
              htmlFor="contact-message"
              className="mb-2 block text-sm font-semibold text-zinc-800"
            >
              Message
            </label>

            <textarea
              id="contact-message"
              name="message"
              required
              rows={6}
              placeholder="Tell us a little about your project..."
              className="focus-ring w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
            />
          </div>

          <PublicButton type="submit" variant="primary">
            Prepare Enquiry
          </PublicButton>

          <p className="text-xs leading-5 text-zinc-400">
            Submitting this form will open your default email
            application with the enquiry details prepared.
          </p>
        </form>
      </div>
    </Reveal>
  );
};

export default ContactForm;