/**
 * Whether the code loop has passed on a spec, and whether that still means anything.
 *
 * A render is the expensive half of the spec-to-figma loop, so it is not sent until the screen holds
 * up in code. `npm run loop` leaves a stamp beside its report; `npm run figma:emit` reads it and
 * refuses a spec the loop has not passed, or one that has changed since it did.
 *
 * The stamp is machine state, not a report: it is not committed. A fresh clone therefore has none,
 * and the loop has to run before a render — which is the point.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { repoRoot } from "../review/catalog.mjs";

/** Where the stamp sits: beside the loop's own report, as `<name>.status.json`. */
export const STATUS_DIR = "reports/loop";

/** The stamp for one screen. */
export const statusFile = (name, root = repoRoot) => join(root, STATUS_DIR, `${name}.status.json`);

/** The spec as it is on disk right now, as one hash: the thing the loop actually passed on. */
export function specHash(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 16);
}

/**
 * Write the stamp.
 * @param {{ root?: string, name: string, specFile: string, ok: boolean, attempts?: number }} options
 */
export function writeLoopStatus({ root = repoRoot, name, specFile, ok, attempts = 0 }) {
  const full = resolve(root, specFile);
  const file = statusFile(name, root);
  mkdirSync(dirname(file), { recursive: true });
  const stamp = {
    screen: name,
    spec: relative(root, full).replace(/\\/g, "/"),
    ok: Boolean(ok),
    attempts,
    hash: specHash(full),
    at: new Date().toISOString(),
  };
  writeFileSync(file, `${JSON.stringify(stamp, null, 2)}\n`);
  return { ...stamp, file: relative(root, file).replace(/\\/g, "/") };
}

/**
 * Read the stamp for a spec.
 * @param {{ root?: string, specFile: string }} options
 * @returns {{ ok: boolean, stale: boolean, screen: string, at: string, attempts: number, file: string } | null}
 *   null when the loop has never run on this spec.
 */
export function readLoopStatus({ root = repoRoot, specFile }) {
  const full = resolve(root, specFile);
  if (!existsSync(full)) return null;
  let name = null;
  try {
    name = JSON.parse(readFileSync(full, "utf8")).name ?? null;
  } catch {
    return null;
  }
  if (!name) return null;
  const file = statusFile(name, root);
  if (!existsSync(file)) return null;
  let stamp = null;
  try {
    stamp = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
  return {
    ok: Boolean(stamp.ok),
    // The loop passed on the spec as it was then. A spec edited since is a screen nobody has run.
    stale: stamp.hash !== specHash(full),
    screen: stamp.screen ?? name,
    at: stamp.at ?? null,
    attempts: Number(stamp.attempts ?? 0),
    file: relative(root, file).replace(/\\/g, "/"),
  };
}
