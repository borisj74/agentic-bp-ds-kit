// Bad on purpose: the review has to find bp/local-cousin here.
import type { ReactNode } from "react";

/* BAD: bp/local-cousin */
export function Dialog({ children }: { children: ReactNode }) {
  return <div role="dialog">{children}</div>;
}
