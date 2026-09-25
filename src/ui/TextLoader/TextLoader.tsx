import type { CSSProperties } from "react";
import styles from "./TextLoader.module.css";

export type TextLoaderSize = "sm" | "md" | "lg";
export type TextLoaderSpeed = "slow" | "normal" | "fast";

export interface TextLoaderProps {
  children: string;
  size?: TextLoaderSize;
  speed?: TextLoaderSpeed;
}

// One wave, as a share of the kit's loading loop.
const SPEED: Record<TextLoaderSpeed, number> = { slow: 1.5, normal: 1, fast: 0.75 };

// Reference kit shimmer text: each letter fades in and out a little after the one before, so light runs left to right.
export function TextLoader({ children, size = "md", speed = "normal" }: TextLoaderProps) {
  const text = String(children);
  const letters = Array.from(text);
  const span = Math.max(letters.length - 1, 1);
  return (
    <span className={[styles.root, styles[size]].join(" ")} style={{ "--speed": SPEED[speed] } as CSSProperties}>
      {/* Screen readers get the line once, as one phrase; the letters are for the eye. */}
      <span className={styles.srOnly}>{text}</span>
      <span className={styles.content} aria-hidden="true">
        {letters.map((ch, i) => (
          // A negative delay puts each letter at its own point in the wave from the first frame.
          <span key={i} className={styles.letter} style={{ "--phase": 1 - i / span } as CSSProperties}>{ch}</span>
        ))}
      </span>
    </span>
  );
}
