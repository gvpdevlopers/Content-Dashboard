import { CalendarDays } from "lucide-react";

const LegalLastUpdated = ({
  date = "September 2026",
}) => {
  return (
    <div
      className="
        mb-7
        flex
        items-center
        gap-2.5
        border-b
        border-zinc-100
        pb-5
        text-xs
        text-zinc-400
        sm:mb-8
        sm:pb-5
      "
    >
      <span
        className="
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center
          rounded-lg
          border
          border-zinc-200
          bg-zinc-50
          text-zinc-400
        "
      >
        <CalendarDays
          size={13}
          strokeWidth={1.7}
          aria-hidden="true"
        />
      </span>

      <span className="font-medium">
        Last updated
      </span>

      <span className="h-3 w-px bg-zinc-200" />

      <span className="font-semibold text-zinc-600">
        {date}
      </span>
    </div>
  );
};

export default LegalLastUpdated;