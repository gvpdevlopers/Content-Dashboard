const GradientText = ({
  children,
  className = "",
  variant = "dark",
}) => {
  const variantClasses = {
    dark: "from-zinc-700 via-zinc-500 to-zinc-900",
    light: "from-white via-zinc-300 to-zinc-500",
  };

  return (
    <span
      className={[
        "gradient-text",
        "inline-block",
        "bg-gradient-to-r",
        "bg-clip-text",
        "text-transparent",
        "align-baseline",
        "bg-[length:100%_100%]",
        variantClasses[variant] || variantClasses.dark,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-gradient-variant={variant}
    >
      {children}
    </span>
  );
};

export default GradientText;