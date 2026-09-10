"use client";
import { Icon } from "@/ui/Icon/Icon";
import { Button } from "@/ui/Button/Button";
import styles from "./icons.module.css";
import { useCopy } from "./useCopy";

const common = [
  "home", "search", "menu", "settings", "person", "notifications", "calendar_month", "check", "close", "add", "remove", "arrow_forward",
  "download", "upload", "edit", "content_copy", "delete", "more_horiz", "auto_awesome", "check_circle", "info", "warning", "help",
  "chevron_left", "chevron_right", "expand_less", "expand_more", "visibility", "visibility_off", "lock", "lock_open", "mail", "call",
  "chat_bubble", "attach_file", "photo_camera", "image", "description", "folder", "folder_open", "save", "inventory_2", "refresh", "undo",
  "filter_list", "tune", "add_circle", "cancel", "open_in_new", "link", "share", "play_arrow", "pause", "schedule", "location_on", "language",
  "favorite", "star", "shopping_cart", "credit_card", "package_2", "bar_chart", "database", "cloud", "wifi", "bolt", "layers", "login", "logout",
  "receipt_long", "request_quote", "account_balance", "payments", "sync", "history",
];

const snippet = `import { Icon } from "@/ui/Icon/Icon";

<Icon name="search" />
<Button iconOnly iconStart="settings">Settings</Button>`;

export function IconsFoundation() {
  const c = useCopy();
  return (
    <>
      <h2 className={styles.h2}>Common icons</h2>
      <p className={styles.hint}>Start with familiar, literal symbols. Keep the same icon for the same concept across the product. Click a tile to copy its name.</p>
      <div className={styles.grid}>
        {common.map((n) => {
          const done = c.copied === n;
          return (
            <button key={n} type="button" className={styles.tile} onClick={() => c.copy(n, n)} aria-label={`Copy icon name ${n}`}>
              <Icon name={n} size="lg" />
              <span className={`${styles.name} ${done ? styles.copied : ""}`} aria-live="polite">{done ? "Copied" : n}</span>
            </button>
          );
        })}
      </div>

      <h2 className={styles.h2}>Sizes</h2>
      <p className={styles.hint}>sm 16 · md 20 · lg 24 · xl 32. Controls pick the size; do not set custom dimensions.</p>
      <div className={styles.sizes}>
        {(["sm", "md", "lg", "xl"] as const).map((s) => (
          <div key={s} className={styles.size}><Icon name="favorite" size={s} /><span className={styles.name}>{s}</span></div>
        ))}
        <div className={styles.size}><Icon name="favorite" size="lg" filled /><span className={styles.name}>filled</span></div>
      </div>

      <h2 className={styles.h2}>Usage</h2>
      <p className={styles.hint}>One Icon component. Names are Material Symbols ligatures.</p>
      <div className={styles.codeWrap}>
        <pre className={styles.code}>{snippet}</pre>
        <span className={styles.codeCopy}>
          <Button size="sm" variant="tertiary" iconStart={c.copied === "snippet" ? "check" : "content_copy"} onClick={() => c.copy("snippet", snippet)}>
            {c.copied === "snippet" ? "Copied" : "Copy"}
          </Button>
        </span>
      </div>

      <h2 className={styles.h2}>Rules</h2>
      <ul className={styles.rules}>
        <li>Use semantic icon colors: tone=&quot;neutral&quot;, &quot;subtle&quot;, &quot;brand&quot; or a status tone. Default inherits text color.</li>
        <li>Let controls decide icon size. Do not pass custom pixel sizes.</li>
        <li>Decorative icons are hidden from assistive tech automatically. Pass label when the icon carries meaning.</li>
        <li>Icon-only Buttons still need children text. It becomes the accessible name.</li>
        <li>Do not use brand marks or emoji as interface icons.</li>
      </ul>
    </>
  );
}
