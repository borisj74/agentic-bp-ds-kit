/**
 * The name tag a kit piece wears on a running screen.
 *
 * Every kit component and pattern spreads `inspect("<contract name>")` on its root. With the switch on, the root
 * carries `data-bp-kit="<contract name>"`, so `npm run review -- --url <url>` can read a served page and say which
 * kit pieces it found. With the switch off the call returns an empty object, so nothing reaches the markup.
 *
 * The switch is `NEXT_PUBLIC_BP_INSPECT=1`, and development only. A production build inlines `NODE_ENV` as
 * "production", so the check is false at build time and the attribute never reaches the output.
 *
 * It is a plain function, not a React hook: server components render kit pieces too, and they cannot call hooks.
 */

/** What a kit piece spreads on its root. Empty unless the switch is on. */
export type InspectAttrs = { "data-bp-kit"?: string };

/** The one env var that turns the name tags on, so nothing else has to know its name. */
export const INSPECT_ENV = "NEXT_PUBLIC_BP_INSPECT";

/** The attribute the name tags use, so the review and the tests read one name. */
export const INSPECT_ATTR = "data-bp-kit";

const NONE: InspectAttrs = {};

/** True in development with the switch on. False in a production build, where the check is settled at build time. */
export function inspectOn(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_BP_INSPECT === "1";
}

/** The root attributes for one kit piece: its contract name when the switch is on, nothing otherwise. */
export function inspect(name: string): InspectAttrs {
  return inspectOn() ? { "data-bp-kit": name } : NONE;
}
