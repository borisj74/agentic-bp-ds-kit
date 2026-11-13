import type { CSSProperties, ReactNode } from "react";
import styles from "./Skeleton.module.css";
import { inspect } from "../inspect";

export type SkeletonShape = "text" | "circle" | "rect";
export type SkeletonSize = "sm" | "md" | "lg";
export type SkeletonAnimation = "shimmer" | "pulse" | "none";
export type SkeletonTone = "default" | "band" | "brand";

export interface SkeletonProps {
  shape?: SkeletonShape;
  lines?: number;
  size?: SkeletonSize;
  width?: string | number;
  height?: string | number;
  animation?: SkeletonAnimation;
  tone?: SkeletonTone;
  loading?: boolean;
  children?: ReactNode;
  label?: string;
}

const px = (v?: string | number) => (typeof v === "number" ? `${v}px` : v);

// Gray shapes in the layout of loading content. Shimmer is painted against the window, so every skeleton on the page
// catches the same band of light at once.
export function Skeleton({
  shape = "text", lines = 1, size = "md", width, height, animation = "shimmer", tone = "default", loading = true, children, label = "Loading",
}: SkeletonProps) {
  if (!loading) return <>{children}</>;
  const count = shape === "text" ? Math.max(Math.floor(lines), 1) : 1;
  // A circle stays round: its width sets both sides. Every other shape takes its width on the wrapper, not on
  // the shape inside it, so a skeleton given a width keeps it in a row beside other things instead of stretching
  // to fill the row; the shape then fills the wrapper.
  const box: CSSProperties = shape === "circle" ? { width: px(width), height: px(width) } : { height: px(height) };
  return (
    <span {...inspect("Skeleton")} className={[styles.root, styles[shape], styles[size], styles[animation], styles[`tone-${tone}`]].join(" ")} style={width === undefined ? undefined : { width: px(width) }} aria-busy="true">
      {label && <span className={styles.srOnly}>{label}</span>}
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={[styles.bone, count > 1 && i === count - 1 ? styles.last : ""].join(" ")} style={shape === "text" ? undefined : box} aria-hidden="true" />
      ))}
    </span>
  );
}
