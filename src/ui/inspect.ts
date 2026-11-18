/**
 * The name tag a kit piece wears on a running screen.
 *
 * Every kit component and pattern spreads `inspect("<contract name>")` on its root. With the switch on, the root
 * carries `data-bp-kit="<contract name>"`, so `npm run review -- --url <url>` can read a served page and say which
 * kit pieces it found. With the switch off the call returns an empty object, so nothing reaches the markup.
 *
 * Turning it on, in order of precedence:
 *
 * 1. `setInspect(true)` from code, for a host that has no build-time env inlining.
 * 2. `globalThis.BP_INSPECT = "1"` (or `true`), set before the first render.
 * 3. `NEXT_PUBLIC_BP_INSPECT=1`, which Next inlines into the client bundle.
 * 4. `BP_INSPECT=1`, a plain env var for any other bundler or a Node render.
 *
 * It is off unless one of those says otherwise, and it is off in a production build whatever they say. Every read is
 * guarded, so a host with no `process`, no `process.env` and no global still renders instead of crashing.
 *
 * It is a plain function, not a React hook: server components render kit pieces too, and they cannot call hooks.
 */

/** What a kit piece spreads on its root. Empty unless the switch is on. */
export type InspectAttrs = { "data-bp-kit"?: string };

/** The Next env var that turns the name tags on, so nothing else has to know its name. */
export const INSPECT_ENV = "NEXT_PUBLIC_BP_INSPECT";

/** The same switch for a host that is not Next: a plain env var, and the name of the global. */
export const INSPECT_ENV_PLAIN = "BP_INSPECT";

/** The attribute the name tags use, so the review and the tests read one name. */
export const INSPECT_ATTR = "data-bp-kit";

const NONE: InspectAttrs = {};

/** Set from code, and the last word on the switch. `undefined` means "nobody said", so the env is read instead. */
let override: boolean | undefined;

/** Turn the name tags on or off from code. `setInspect(undefined)` hands the decision back to the env. */
export function setInspect(on: boolean | undefined): void {
  override = on;
}

/**
 * The Next switch, read as a literal so a bundler that inlines `process.env.NEXT_PUBLIC_*` still sees it. The
 * try/catch is for a host where `process` does not exist at all, such as a plain browser bundle.
 */
function nextEnv(): string | undefined {
  try {
    return process.env.NEXT_PUBLIC_BP_INSPECT;
  } catch {
    return undefined;
  }
}

/** The build mode, also read as a literal so a bundler that inlines `process.env.NODE_ENV` still sees it. */
function nodeEnv(): string | undefined {
  try {
    return process.env.NODE_ENV;
  } catch {
    return undefined;
  }
}

/** One env var looked up by name, for the plain switch. Assumes nothing about `process` or `process.env`. */
function env(name: string): string | undefined {
  try {
    const p = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
    return p?.env?.[name];
  } catch {
    return undefined;
  }
}

/** The global switch, for a host that can set neither an env var nor a build-time define. */
function globalSwitch(): boolean | undefined {
  try {
    const v = (globalThis as Record<string, unknown>)[INSPECT_ENV_PLAIN];
    if (v === undefined || v === null) return undefined;
    return v === true || v === "1" || v === "true";
  } catch {
    return undefined;
  }
}

/** True unless something says this is a production build. A missing `NODE_ENV` is not production. */
function notProduction(): boolean {
  return nodeEnv() !== "production";
}

/**
 * True when the name tags are on: an explicit `setInspect(true)`, the global, or either env var — and never in a
 * production build. `options.on` answers for this one call, so a host can pass its own switch straight in.
 */
export function inspectOn(options?: { on?: boolean }): boolean {
  if (options?.on !== undefined) return options.on && notProduction();
  if (override !== undefined) return override && notProduction();
  const g = globalSwitch();
  if (g !== undefined) return g && notProduction();
  const on = nextEnv() === "1" || env(INSPECT_ENV) === "1" || env(INSPECT_ENV_PLAIN) === "1";
  return on && notProduction();
}

/** The root attributes for one kit piece: its contract name when the switch is on, nothing otherwise. */
export function inspect(name: string, options?: { on?: boolean }): InspectAttrs {
  return inspectOn(options) ? { "data-bp-kit": name } : NONE;
}
