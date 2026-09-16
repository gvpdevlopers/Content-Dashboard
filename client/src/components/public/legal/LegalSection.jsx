const LegalSection = ({
  number,
  title,
  children,
}) => {
  return (
    <section
      className="scroll-mt-28 border-b border-zinc-100 py-8 first:pt-0 last:border-b-0 sm:py-10"
    >
      <div className="flex gap-4 sm:gap-6">
        {number && (
          <span className="hidden shrink-0 pt-1 text-xs font-bold tracking-[0.12em] text-zinc-300 sm:block">
            {number}
          </span>
        )}

        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-[-0.025em] text-zinc-950 sm:text-2xl">
            {title}
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-500 sm:text-base sm:leading-8">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LegalSection;