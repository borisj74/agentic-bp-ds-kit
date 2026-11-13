import styles from "./LoadingLine.module.css";
import { inspect } from "../inspect";

export type LoadingLineTrack = "line" | "none";

export interface LoadingLineProps {
  loading?: boolean;
  track?: LoadingLineTrack;
  label?: string;
}

// The 2px line that says a page is still arriving: a short brand bar sliding over a faint brand track, with no
// amount done to report. BP COBALT DSL-198. It fills the box it is put in, so the frame places it: over the
// top of the content column, level with the top of the side nav and just under the app header's border.
export function LoadingLine({ loading = true, track = "line", label = "Loading" }: LoadingLineProps) {
  if (!loading) return null;
  return (
    <div {...inspect("LoadingLine")}
      className={[styles.line, track === "none" ? styles.bare : ""].join(" ")}
      role="progressbar" aria-label={label}
    >
      {/* No value on the role: a progressbar with none is indeterminate, which is what this line is. */}
      <span className={styles.bar} aria-hidden="true" />
    </div>
  );
}
