import GradientText from "./GradientText";

const SectionHeading = ({
  eyebrow,
  title,
  highlight,
  description,
  align = "left",
}) => {
  const alignment =
    align === "center"
      ? "mx-auto text-center items-center"
      : "text-left items-start";

  return (
    <div className={`flex max-w-3xl flex-col ${alignment}`}>
      {eyebrow && (
        <span className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)] sm:text-sm">
          {eyebrow}
        </span>
      )}

      <h2 className="text-3xl font-bold tracking-[-0.035em] text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl">
        {title}{" "}
        {highlight && <GradientText>{highlight}</GradientText>}
      </h2>

      {description && (
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-muted)] sm:text-lg sm:leading-8">
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;