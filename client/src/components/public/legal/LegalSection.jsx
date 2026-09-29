const LegalSection = ({
  number,
  title,
  children,
}) => {
  return (
    <section
      className="
        scroll-mt-28
        border-b
        border-zinc-100
        py-6
        first:pt-0
        last:border-b-0
        last:pb-0
        sm:py-8
      "
    >
      <div className="flex gap-4 sm:gap-5">
        {/* Section number */}
        {number && (
          <span
            className="
              hidden
              shrink-0
              pt-1
              text-[10px]
              font-bold
              tracking-[0.14em]
              text-zinc-300
              sm:block
            "
          >
            {number}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <h2
            className="
              text-xl
              font-bold
              leading-tight
              tracking-[-0.03em]
              text-zinc-950
              sm:text-2xl
            "
          >
            {title}
          </h2>

          <div
            className="
              mt-3
              space-y-3
              text-sm
              leading-6
              text-zinc-500
              sm:mt-4
              sm:space-y-4
              sm:text-base
              sm:leading-7
            "
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LegalSection;