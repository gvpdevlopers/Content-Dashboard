const Section = ({
  children,
  className = "",
  containerClassName = "",
  id,
}) => {
  return (
    <section
      id={id}
      className={`relative w-full py-16 sm:py-20 lg:py-28 ${className}`}
    >
      <div
        className={`mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 ${containerClassName}`}
      >
        {children}
      </div>
    </section>
  );
};

export default Section;