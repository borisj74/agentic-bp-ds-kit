/**
 * The repairs the loop can make on its own.
 *
 * A fixer changes the spec, never the generated code: the spec is the source of truth, so a repair
 * that only patched the TSX would be undone by the next build. Each fixer is mechanical — it needs no
 * taste, and it can only make the spec more like what the contracts already say. Everything else the
 * loop reports for a person or an agent to decide.
 *
 *   fixSpec(spec, { errors, findings }) — { spec, fixes: [{ rule, what }] }
 */

/** Walk every node in every region, deepest last, with the list that holds it. */
function* walk(spec) {
  const visit = function* (nodes, path) {
    for (const [i, node] of nodes.entries()) {
      yield { node, nodes, index: i, path: `${path}[${i}]` };
      for (const [slot, children] of Object.entries(node.slots ?? {})) {
        yield* visit(children, `${path}[${i}].slots.${slot}`);
      }
    }
  };
  for (const [region, nodes] of Object.entries(spec.regions ?? {})) {
    yield* visit(nodes ?? [], `regions.${region}`);
  }
}

const clone = (spec) => JSON.parse(JSON.stringify(spec));

/** Keep the first strong brand Button and make the rest subtle neutral. */
function onePrimary(spec) {
  const fixes = [];
  let seen = 0;
  for (const { node, path } of walk(spec)) {
    if (node.component !== "Button") continue;
    if (node.props?.emphasis !== "strong" || node.props?.intent !== "brand") continue;
    seen += 1;
    if (seen === 1) continue;
    node.props.emphasis = "subtle";
    delete node.props.intent;
    fixes.push({ rule: "bp/one-primary", what: `${path} is now subtle neutral; the screen keeps one strong brand Button.` });
  }
  return fixes;
}

/** The frame draws the page title as the one h1, so a PageHeader inside a region is a second one. */
function onePageHeader(spec) {
  const fixes = [];
  for (const { node, nodes, index, path } of [...walk(spec)].reverse()) {
    if (node.component !== "PageHeader") continue;
    // A pattern that takes its own header (FormPage) keeps that one: the frame then draws none.
    if (/^regions\.header\[\d+\]$/.test(path)) continue;
    nodes.splice(index, 1);
    fixes.push({ rule: "bp/landmark", what: `${path} was removed; the frame's PageHeader is the screen's one h1.` });
  }
  return fixes;
}

/** Home is added by the frame, so the spec never lists it. */
function breadcrumbs(spec) {
  if (!Array.isArray(spec.breadcrumbs)) return [];
  const kept = spec.breadcrumbs.filter((label) => String(label).toLowerCase() !== "home");
  if (kept.length === spec.breadcrumbs.length) return [];
  spec.breadcrumbs = kept;
  return [{ rule: "bp/screen-frame", what: "Home was dropped from breadcrumbs; the frame adds it." }];
}

const FIXERS = [onePrimary, onePageHeader, breadcrumbs];

/**
 * Repair what can be repaired mechanically.
 * @param {object} spec The spec as it stands.
 * @returns {{ spec: object, fixes: { rule: string, what: string }[] }} A new spec and what changed.
 */
export function fixSpec(spec) {
  const next = clone(spec);
  const fixes = [];
  for (const fixer of FIXERS) fixes.push(...fixer(next));
  return { spec: next, fixes };
}
