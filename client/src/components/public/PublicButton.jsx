import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Magnetic from "./Magnetic";

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
      <span className="public-button__shine" aria-hidden="true" />

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
  const magneticClassName = className.split(/\s+/).includes("w-full")
    ? "w-full"
    : "";

  if (to) {
    return (
      <Magnetic className={magneticClassName}>
        <Link to={to} className={classes} {...props}>
          {content}
        </Link>
      </Magnetic>
    );
  }

  if (href) {
    return (
      <Magnetic className={magneticClassName}>
        <a href={href} className={classes} {...props}>
          {content}
        </a>
      </Magnetic>
    );
  }

  return (
    <Magnetic className={magneticClassName}>
      <button type="button" className={classes} {...props}>
        {content}
      </button>
    </Magnetic>
  );
};

export default PublicButton;