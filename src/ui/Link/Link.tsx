import type { MouseEventHandler, ReactNode } from "react";
import { Icon } from "../Icon/Icon";
import styles from "./Link.module.css";

export type LinkTone = "brand" | "neutral";

export interface LinkProps {
  children: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  tone?: LinkTone;
  external?: boolean;
  disabled?: boolean;
}

// Inline text that takes people somewhere: a record, a list, another page. Brand blue so it reads as a link, the
// same colours as the link Cell. Without href it acts in place, as a button that looks like a link.
export function Link({ children, href, onClick, tone = "brand", external = false, disabled = false }: LinkProps) {
  const cls = [styles.link, styles[tone], disabled ? styles.disabled : ""].join(" ");
  const body = (
    <>
      {children}
      {external && (
        <>
          <Icon name="open_in_new" size="sm" className={styles.icon} />
          <span className={styles.srOnly}> (opens in a new tab)</span>
        </>
      )}
    </>
  );

  if (disabled) return <span className={cls} aria-disabled="true">{body}</span>;
  if (!href) return <button type="button" className={[cls, styles.button].join(" ")} onClick={onClick}>{body}</button>;
  return (
    <a className={cls} href={href} onClick={onClick} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
      {body}
    </a>
  );
}
