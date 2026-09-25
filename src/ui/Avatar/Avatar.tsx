"use client";
import { useState } from "react";
import { Icon } from "../Icon/Icon";
import styles from "./Avatar.module.css";

export type AvatarSize = "xs" | "sm" | "md" | "lg";
export type AvatarShape = "circle" | "square";

export interface AvatarProps {
  name: string;
  src?: string;
  initials?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  decorative?: boolean;
}

const letters = (value: string) => Array.from(value).filter((ch) => /\p{L}/u.test(ch)).join("");

// Two or more words: first + last letter. One word: first two letters.
function initialsOf(name: string, override?: string) {
  const own = override ? letters(override).slice(0, 2) : "";
  if (own) return own.toUpperCase();
  const words = name.trim().split(/\s+/).map(letters).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

const iconSize = { xs: "sm", sm: "sm", md: "md", lg: "lg" } as const;

// decorative: the name is already written beside the avatar, so screen readers skip the picture instead of saying it twice.
export function Avatar({ name, src, initials, size = "md", shape = "circle", decorative = false }: AvatarProps) {
  // Remember which src failed, so a new src gets a fresh try.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const cls = [styles.avatar, styles[size], styles[shape]].join(" ");

  if (src && failedSrc !== src) {
    return (
      <span className={cls}>
        {/* eslint-disable-next-line @next/next/no-img-element -- any photo URL, no size known up front */}
        <img className={styles.image} src={src} alt={decorative ? "" : name} onError={() => setFailedSrc(src)} />
      </span>
    );
  }

  const label = initialsOf(name, initials);
  return (
    <span className={[cls, styles.fallback].join(" ")} {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": name })}>
      {label || <Icon name="person" size={iconSize[size]} />}
    </span>
  );
}
