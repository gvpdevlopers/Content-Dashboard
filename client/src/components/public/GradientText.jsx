const GradientText = ({ children, className = "" }) => {
  return (
    <span
      className={`bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 bg-clip-text text-transparent ${className}`}
    >
      {children}
    </span>
  );
};

export default GradientText;