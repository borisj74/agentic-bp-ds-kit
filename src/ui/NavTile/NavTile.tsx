"use client";
import { Icon } from "../Icon/Icon";
import { Skeleton } from "../Skeleton/Skeleton";
import { skeletonBarWidth, useFieldSkeleton } from "../LoadingLine/boot";
import styles from "./NavTile.module.css";

export type NavTileIntent = "brand" | "green" | "olive" | "cyan" | "orange" | "pink" | "gray" | "purple" | "yellow" | "red" | "mint";

export interface NavTileProps {
  title: string;
  description?: string;
  icon?: string;
  intent?: NavTileIntent;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

// One way in to somewhere: the name of the place, a line about what is inside, and a colored square. A grid
// of them is a landing page. A link, not a choice: comparing and picking is Card.
export function NavTile({ title, description, icon, intent = "brand", href, onClick, disabled = false }: NavTileProps) {
  // A tile in a booting page draws its own shape: a bar as long as its name, a line where its description will be,
  // and a block where its square is, so a grid of tiles is the grid the places land in.
  const booting = useFieldSkeleton();
  if (booting) {
    return (
      <div className={styles.root} aria-hidden="true">
        <span className={styles.text}>
          <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(title)} height="var(--text-title-md-size)" label="" />
          {description && <Skeleton shape="rect" animation="pulse" width={skeletonBarWidth(description)} height="var(--skeleton-cell)" label="" />}
        </span>
        {/* The square is what gives a tile its height, so its block keeps the tile the size it will be. */}
        {icon && <Skeleton shape="rect" animation="pulse" width="var(--card-tile)" height="var(--card-tile)" label="" />}
      </div>
    );
  }
  const body = (
    <>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
      {/* The square is decorative: the title already names the place. */}
      {icon && (
        <span className={[styles.square, styles[intent]].join(" ")} aria-hidden="true">
          <Icon name={icon} size="xl" intent="inherit" />
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
