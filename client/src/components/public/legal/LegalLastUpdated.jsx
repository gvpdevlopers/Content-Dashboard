const LegalLastUpdated = ({ date = "September 2026" }) => {
  return (
    <div className="mb-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-200 pb-6 text-xs text-zinc-400">
      <span className="font-semibold uppercase tracking-[0.12em]">
        Last updated
      </span>

      <span>{date}</span>
    </div>
  );
};

export default LegalLastUpdated;