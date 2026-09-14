"use client";
import { useId, useState, type ReactNode } from "react";
import { Button } from "../Button/Button";
import { HelpPopover } from "../HelpPopover/HelpPopover";
import { Icon } from "../Icon/Icon";
import styles from "./Section.module.css";

export type SectionLine = "medium" | "thin";

export interface SectionProps {
  title: string;
  description?: string;
  help?: string;
  actions?: ReactNode;
  children?: ReactNode;
  line?: SectionLine;
  collapsible?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Figma COBALT section header 304:31917: chevron button, bold title, ? help, actions at the end, a brand-faint line under it.
export function Section({
  title, description, help, actions, children, line = "medium", collapsible = false, open: openProp, defaultOpen = true, onOpenChange,
}: SectionProps) {
  const uid = useId();
  const headingId = `${uid}-title`;
  const bodyId = `${uid}-body`;
  const helpId = `${uid}-help`;
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const open = !collapsible || (openProp ?? innerOpen);

  const toggle = () => {
    if (openProp === undefined) setInnerOpen(!open);
    onOpenChange?.(!open);
  };

  return (
    <section className={[styles.section, line === "thin" ? styles.thin : ""].join(" ")} aria-labelledby={headingId}>
      <header className={styles.header}>
        <div className={styles.row}>
          {collapsible && (
            <Button
              variant="tertiary" size="sm" iconOnly iconStart={open ? "expand_more" : "chevron_right"}
              aria-expanded={open} aria-controls={children != null ? bodyId : undefined} onClick={toggle}
            >
              {title}
            </Button>
          )}
          <h2 id={headingId} className={styles.title} aria-describedby={help ? helpId : undefined}>{title}</h2>
          {help && (
            <HelpPopover title={title} content={help}>
              <button type="button" className={styles.help} aria-label={`About ${title}`}><Icon name="help_center" size="sm" /></button>
            </HelpPopover>
          )}
          {help && <span id={helpId} className={styles.srOnly}>{help}</span>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
        {description && <p className={styles.description}>{description}</p>}
      </header>
      {/* Header only: without children there is no body, so the section is just its heading row and line. */}
      {children != null && (
        <div id={bodyId} className={styles.body} hidden={!open}>
          {children}
        </div>
      )}
    </section>
  );
}
