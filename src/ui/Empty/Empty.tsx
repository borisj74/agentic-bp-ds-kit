import type { ReactNode } from "react";
import { Icon } from "../Icon/Icon";
import styles from "./Empty.module.css";

export type EmptyIconStyle = "well" | "plain";
export type EmptyHeadingLevel = 2 | 3 | 4;

export interface EmptyProps {
  title: string;
  description?: string;
  icon?: string;
  iconStyle?: EmptyIconStyle;
  media?: ReactNode;
  actions?: ReactNode;
  outlined?: boolean;
  headingLevel?: EmptyHeadingLevel;
}

// Reference kit empty: a round icon well (or a kit Avatar), a title, a line of help and the actions, centred.
export function Empty({ title, description, icon, iconStyle = "well", media, actions, outlined = false, headingLevel = 3 }: EmptyProps) {
  // The title takes the next heading level where it sits: h2 straight under a page title, h3 inside a Section.
  const Heading = `h${headingLevel}` as const;
  return (
    <div className={[styles.empty, outlined ? styles.outlined : ""].join(" ")}>
      {media ? <div className={styles.media}>{media}</div> : icon && iconStyle === "plain" ? (
        // Plain: a large filled icon with no well, as big as the well itself.
        <span className={styles.plain} aria-hidden="true"><Icon name={icon} size="xl" filled style={{ fontSize: "var(--empty-media)" }} /></span>
      ) : icon ? (
        <span className={styles.well} aria-hidden="true"><Icon name={icon} size="md" /></span>
      ) : null}
      <div className={styles.copy}>
        <Heading className={styles.title}>{title}</Heading>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
