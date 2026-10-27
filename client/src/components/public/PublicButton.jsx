import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const PublicButton = ({
  children,
  to,
  href,
  variant = "primary",
  showArrow = true,
  className = "",
  ...props
}) => {
  const classes = [
    "public-button",
    `public-button--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="public-button__content">
        <span className="public-button__label">{children}</span>

        {showArrow && (
          <span className="public-button__icon" aria-hidden="true">
            <ArrowUpRight size={16} strokeWidth={2} />
          </span>
        )}
      </span>
    </>
  );
  const wrapperClassName = className.split(/\s+/).includes("w-full")
    ? "w-full"
    : "";

  if (to) {
    return (
      <span className={`inline-flex max-w-full ${wrapperClassName}`}>
        <Link to={to} className={classes} {...props}>
          {content}
        </Link>
      </span>
    );
  }

  if (href) {
    return (
      <span className={`inline-flex max-w-full ${wrapperClassName}`}>
        <a href={href} className={classes} {...props}>
          {content}
        </a>
      </span>
    );
  }

  return (
    <span className={`inline-flex max-w-full ${wrapperClassName}`}>
      <button type="button" className={classes} {...props}>
        {content}
      </button>
    </span>
  );
};

export default PublicButton;