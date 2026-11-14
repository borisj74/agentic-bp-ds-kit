/**
 * The live check: it reads a served page and says which kit pieces are on it.
 *
 * It fetches the server-rendered HTML and looks for the name tags the kit components wear
 * (`data-bp-kit="<contract name>"`, from `src/ui/inspect.ts`). No browser, no new dependency: the page is text,
 * and the tags are enough to say what the screen is built from.
 *
 * The tags are development only, so the server has to run with NEXT_PUBLIC_BP_INSPECT=1.
 */
import { catalog, repoRoot } from "./catalog.mjs";

/** The attribute a kit piece wears on a running screen. The same name as `INSPECT_ATTR` in src/ui/inspect.ts. */
export const INSPECT_ATTR = "data-bp-kit";

/** The env var that turns the name tags on. */
export const INSPECT_ENV = "NEXT_PUBLIC_BP_INSPECT";

/** Biggest piece first, the kit's build order. A piece with no level in its contract falls under "unknown". */
export const LEVEL_ORDER = ["template", "organism", "molecule", "atom", "unknown"];

/** The rules the live check reports. */
export const LIVE_RULES = ["bp/no-tags", "bp/landmark", "bp/no-pattern"];

/** The landmarks every screen needs: one main, one nav, exactly one h1. */
const LANDMARKS = ["main", "nav", "h1"];

/** Fetch a page's server-rendered HTML. Throws a plain message a person can read. */
export async function fetchHtml(url, { fetchImpl = fetch } = {}) {
  let response;
  try {
    response = await fetchImpl(url, { headers: { accept: "text/html" } });
  } catch (error) {
    throw new Error(`cannot reach ${url}: ${error instanceof Error ? error.message : String(error)}. Is the dev server running?`);
  }
  if (!response.ok) throw new Error(`${url} answered ${response.status} ${response.statusText || ""}`.trim());
  return await response.text();
}

/** How many times a tag opens in the HTML. */
function countTag(html, tag) {
  return (html.match(new RegExp(`<${tag}[\\s>/]`, "gi")) ?? []).length;
}

/** Read one page's HTML: the kit pieces on it, grouped by level, and its landmarks. */
export function readLive(html, { root = repoRoot } = {}) {
  const { pieces: known } = catalog(root);

  const counts = new Map();
  for (const match of html.matchAll(new RegExp(`${INSPECT_ATTR}="([^"]*)"`, "g"))) {
    const name = match[1].trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const pieces = [...counts.entries()]
    .map(([name, count]) => {
      const piece = known.get(name.toLowerCase());
      return {
        name,
        count,
        kind: piece?.kind ?? null,
        level: piece?.level ?? "unknown",
        contract: piece?.contract ?? null,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const groups = LEVEL_ORDER.map((level) => ({ level, pieces: pieces.filter((p) => p.level === level) })).filter(
    (g) => g.pieces.length > 0,
  );

  const landmarks = {};
  for (const tag of LANDMARKS) landmarks[tag] = countTag(html, tag);

  const tags = pieces.reduce((sum, p) => sum + p.count, 0);
  const patterns = pieces.filter((p) => p.kind === "pattern");

  return { pieces, groups, landmarks, tags, patterns, unknown: pieces.filter((p) => !p.kind) };
}

/** What is wrong with a live page: no name tags, a missing landmark, or no pattern. */
export function liveFindings(live) {
  const findings = [];
  const say = (rule, severity, message, fix) => findings.push({ rule, severity, message, fix });

  if (live.tags === 0) {
    say(
      "bp/no-tags",
      "error",
      `No ${INSPECT_ATTR} on the page, so the review cannot see any kit piece.`,
      `Start the dev server with ${INSPECT_ENV}=1, or check that the screen is built from the kit.`,
    );
    return findings;
  }

  if (live.landmarks.main === 0)
    say("bp/landmark", "error", "No <main> on the page.", "Frame the screen with AppShell: it draws the main landmark.");
  if (live.landmarks.nav === 0)
    say("bp/landmark", "error", "No <nav> on the page.", "Pass items={APP_NAV} and endItems={APP_NAV_END} to AppNav inside AppShell.");
  if (live.landmarks.h1 === 0)
    say("bp/landmark", "error", "No <h1> on the page.", "Give the screen a PageHeader: its title is the page's one h1.");
  else if (live.landmarks.h1 > 1)
    say("bp/landmark", "error", `${live.landmarks.h1} <h1> elements on the page. A screen has one.`, "Keep the PageHeader title as the only h1 and make the rest h2.");

  if (live.patterns.length === 0)
    say(
      "bp/no-pattern",
      "warn",
      "The screen uses no pattern, so it is laying out by hand what a pattern may already draw.",
      "Read the patterns in contracts/index.json (level template) and start from the one that fits.",
    );

  return findings;
}

/** One line a person or an agent can read at a glance. */
export function summarizeLive(live, findings) {
  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.length - errors;
  const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const head = `${count(live.pieces.length, "kit piece", "kit pieces")}, ${count(live.tags, "time", "times")}`;
  if (findings.length === 0) return `${head}: nothing to fix.`;
  return `${head}: ${count(errors, "error", "errors")}, ${count(warnings, "warning", "warnings")}.`;
}

/** The live check as text. */
export function formatLive({ url, live, findings }) {
  const lines = [url];
  for (const group of live.groups) {
    lines.push("");
    lines.push(`  ${group.level}`);
    for (const p of group.pieces) {
      const kind = p.kind === "pattern" ? "pattern" : p.kind === "component" ? "component" : "not in the catalog";
      lines.push(`    ${p.name} × ${p.count}  (${kind})`);
    }
  }
  lines.push("");
  lines.push("  landmarks");
  for (const tag of LANDMARKS) lines.push(`    <${tag}> × ${live.landmarks[tag]}`);
  if (findings.length > 0) {
    lines.push("");
    for (const f of findings) {
      lines.push(`  ${f.severity}  ${f.rule}  ${f.message}`);
      lines.push(`      fix: ${f.fix}`);
    }
  }
  lines.push("");
  lines.push(summarizeLive(live, findings));
  return lines.join("\n");
}

/** The live check as one object for a machine. */
export function liveResult({ url, live, findings }) {
  return {
    url,
    summary: summarizeLive(live, findings),
    tags: live.tags,
    groups: live.groups,
    pieces: live.pieces,
    landmarks: live.landmarks,
    patterns: live.patterns.map((p) => p.name),
    rules: LIVE_RULES,
    findings,
  };
}

/** Fetch a URL and review what it serves. */
export async function reviewUrl(url, { root = repoRoot, fetchImpl = fetch } = {}) {
  const html = await fetchHtml(url, { fetchImpl });
  const live = readLive(html, { root });
  const findings = liveFindings(live);
  return { url, live, findings };
}
