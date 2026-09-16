import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
} from "lucide-react";

const LegalLayout = ({ children }) => {
  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-[1000px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition-colors hover:text-zinc-950"
        >
          <ArrowLeft size={15} />
          Back to Glow Ventures
        </Link>

        <article className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-[0_15px_50px_rgba(24,24,27,0.04)] sm:p-8 lg:p-12">
          {children}
        </article>

        <div className="mt-10 flex flex-col gap-4 border-t border-zinc-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-zinc-400">
            Questions about these policies can be directed to Glow
            Ventures through the contact page.
          </p>

          <Link
            to="/contact"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-zinc-900"
          >
            Contact us
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LegalLayout;