/**
 * The Kit fit score: how much of a screen is drawn with the kit, minus what the review found.
 *
 * It reads the same facts the rules read, so the score never carries a second idea of the kit.
 * Nothing is imported here, so a page can read the score's name and formula without pulling in the catalog.
 */

/** The score's one name. Everything that prints it reads this. */
export const SCORE_NAME = "Kit fit";

/** Points taken off for every error the review found. */
export const ERROR_PENALTY = 5;

/** The formula, in one line, for the text output and the JSON. */
export const SCORE_FORMULA =
  `${SCORE_NAME} = round(100 × kit elements ÷ all UI elements) − ${ERROR_PENALTY} × errors, kept inside 0–100`;

/** Tags that never draw anything, so they stay out of the share. */
const NOT_UI = new Set([
  "html", "head", "body", "meta", "link", "title", "base", "script", "style", "noscript", "template",
  "Fragment", "React.Fragment",
]);

/**
 * How many elements a TSX file draws, and how many of those come from the kit.
 * `isKit` answers whether a tag is a kit piece; the caller passes the catalog's own lookup.
 */
export function uiTally(facts, isKit) {
  let kit = 0;
  let ui = 0;
  for (const el of facts.elements) {
    if (NOT_UI.has(el.tag)) continue;
    ui += 1;
    if (isKit(el.tag)) kit += 1;
  }
  return { kit, ui };
}

/**
 * The score for one run: the kit share, less the error penalty, from 0 to 100.
 * @param {{ tally?: { kit: number, ui: number }, findings?: { severity: string }[] }} input
 */
export function scoreOf({ tally = { kit: 0, ui: 0 }, findings = [] } = {}) {
  const { kit, ui } = tally;
  const errors = findings.filter((f) => f.severity === "error").length;
  const share = ui === 0 ? 1 : kit / ui;
  const base = Math.round(100 * share);
  const penalty = ERROR_PENALTY * errors;
  const value = Math.max(0, Math.min(100, base - penalty));
  return { name: SCORE_NAME, value, kit, ui, share, base, errors, penalty, formula: SCORE_FORMULA };
}

/** The score as the one line a person reads first. */
export function formatScore(score) {
  const parts = [`${score.name}: ${score.value}/100`];
  const drawn = score.ui === 1 ? "element comes" : "elements come";
  parts.push(`  ${score.kit} of ${score.ui} UI ${drawn} from the kit (${score.base}/100)`);
  const taken = score.penalty === 0 ? "0" : `−${score.penalty}`;
  parts.push(`  ${score.errors} ${score.errors === 1 ? "error" : "errors"} × ${ERROR_PENALTY} = ${taken}`);
  parts.push(`  ${score.formula}`);
  return parts.join("\n");
}
