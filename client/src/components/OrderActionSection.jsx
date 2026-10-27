import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function OrderActionSection({ title, icon, badge, children }) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const heading = <><span className="order-action-icon">{icon}</span><span>{title}</span></>;

  return (
    <section className="order-action-section" data-expanded={expanded}>
      <div className="order-action-heading">
        <h2 className="order-action-desktop-title">{heading}</h2>
        <h2 className="order-action-mobile-title">
          <button type="button" aria-expanded={expanded} aria-controls={id}
            onClick={() => setExpanded((value) => !value)}>
            {heading}
            <ChevronDown size={16} className="order-action-chevron" aria-hidden="true" />
          </button>
        </h2>
        {badge}
      </div>
      <div id={id} className="order-action-body">
        <div className="order-action-content">{children}</div>
      </div>
    </section>
  );
}
