"use client";
import { Icon } from "../Icon/Icon";
import styles from "./Tile.module.css";

export type TileTone = "brand" | "green" | "olive" | "cyan" | "orange" | "pink" | "gray" | "purple" | "yellow" | "red" | "mint";

export interface TileProps {
  title: string;
  description?: string;
  icon?: string;
  tone?: TileTone;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

// One way in to somewhere: the name of the place, a line about what is inside, and a colored square. A grid
// of them is a landing page. A link, not a choice: comparing and picking is Card.
export function Tile({ title, description, icon, tone = "brand", href, onClick, disabled = false }: TileProps) {
  const body = (
    <>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
      {/* The square is decorative: the title already names the place. */}
      {icon && (
        <span className={[styles.square, styles[tone]].join(" ")} aria-hidden="true">
          <Icon name={icon} size="xl" tone="inherit" />
        </span>
      )}
    </>
  );

  const cls = [styles.root, disabled ? styles.disabled : ""].join(" ");
  if (href && !disabled) return <a className={cls} href={href}>{body}</a>;
  if (onClick || disabled) {
    return (
      <button type="button" className={cls} onClick={onClick} disabled={disabled}>{body}</button>
    );
  }
  // Nowhere to go: the tile is still read, just not clickable.
  return <div className={cls}>{body}</div>;
}
