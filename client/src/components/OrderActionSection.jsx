import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function OrderActionSection({ title, icon, badge, children, collapsible = false, expanded: controlledExpanded, onExpandedChange }) {
  const id = useId();
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = controlledExpanded ?? localExpanded;
  const toggle = () => {
    if (onExpandedChange) onExpandedChange(!expanded);
    else setLocalExpanded(!expanded);
  };
  const heading = <><span className="order-action-icon">{icon}</span><span>{title}</span></>;

  return (
    <section className={`order-action-section${collapsible ? " order-action-section--collapsible" : ""}`} data-expanded={expanded}>
      <div className="order-action-heading">
        <h2 className="order-action-desktop-title">{heading}</h2>
        <h2 className="order-action-mobile-title">
          <button type="button" aria-expanded={expanded} aria-controls={id}
            onClick={toggle}>
            {heading}
            <ChevronDown size={16} className="order-action-chevron" aria-hidden="true" />
          </button>
        </h2>
        {badge}
      </div>
      <div id={id} className="order-action-body" inert={collapsible && !expanded} aria-hidden={collapsible ? !expanded : undefined}>
        <div className="order-action-content">{children}</div>
      </div>
    </section>
  );
}
