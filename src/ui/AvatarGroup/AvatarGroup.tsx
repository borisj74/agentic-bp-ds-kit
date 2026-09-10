import { Avatar, type AvatarShape, type AvatarSize } from "../Avatar/Avatar";
import styles from "./AvatarGroup.module.css";

export interface AvatarGroupItem {
  name: string;
  src?: string;
  initials?: string;
}

export interface AvatarGroupProps {
  label?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  max?: number;
  items: AvatarGroupItem[];
}

export function AvatarGroup({ label, size = "md", shape = "circle", max = 3, items }: AvatarGroupProps) {
  const visible = items.slice(0, max);
  const rest = items.length - visible.length;
  return (
    <div className={[styles.group, styles[shape]].join(" ")} role="group" aria-label={label}>
      {visible.map((item, i) => (
        // Later faces sit on top, so each ring cuts into the face before it.
        <span key={`${item.name}-${i}`} className={styles.item} style={{ zIndex: i + 1 }}>
          <Avatar name={item.name} src={item.src} initials={item.initials} size={size} shape={shape} />
        </span>
      ))}
      {rest > 0 && (
        <span className={[styles.item, styles.count, styles[size]].join(" ")} style={{ zIndex: visible.length + 1 }} role="img" aria-label={`${rest} more`}>
          +{rest}
        </span>
      )}
    </div>
  );
}
