// Server-side reader for src/tokens/source/*.txt. Resolves aliases to hex for labels.
import { readFileSync } from "node:fs";
import path from "node:path";

const read = (f: string) =>
  readFileSync(path.join(process.cwd(), "src/tokens/source", f), "utf8")
    .split("\n").filter((l) => l.trim() && !l.startsWith("#")).map((l) => l.split("|"));

export const cssVar = (name: string) => "--" + name.replace(/\//g, "-").replace(/^background-/, "bg-");

export type Ramp = { name: string; prefix: string; steps: { step: string; name: string; hex: string }[] };
export type SemanticItem = { name: string; light: string; dark: string; lightHex: string; darkHex: string };
export type SemanticGroup = { title: string; prefix: string; items: SemanticItem[] };

export function loadColorTokens(brand = 0) {
  const ref = read("ref.txt");       // name | cobalt | sunset | olive | bp-legacy
  const ui = read("ui.txt");         // name | light | dark
  const sem = read("semantic.txt");  // name | light | dark

  const refHex = new Map(ref.map(([n, ...v]) => [n, v[brand]]));
  const uiMap = new Map(ui.map(([n, l, d]) => [n, { l, d }]));
  const strip = (s: string) => s.replace(/[{}]/g, "");
  const uiHex = (aliasUi: string, mode: "l" | "d") => {
    const u = uiMap.get(strip(aliasUi)); if (!u) return "";
    return refHex.get(strip(u[mode])) ?? "";
  };

  // Primitives: group ref/* by family
  const families = new Map<string, Ramp["steps"]>();
  for (const [n, ...v] of ref) {
    const parts = n.split("/"); // ref, family, [alpha], step
    const fam = parts.length === 2 ? "singles" : parts.slice(1, -1).join("/");
    const step = parts.length === 2 ? parts[1] : parts[parts.length - 1];
    if (!families.has(fam)) families.set(fam, []);
    families.get(fam)!.push({ step, name: cssVar(n), hex: v[brand] });
  }
  const ramps: Ramp[] = [...families].sort(([a], [b]) => (a === "singles" ? 1 : b === "singles" ? -1 : 0)).map(([fam, steps]) => ({ name: fam, prefix: cssVar(`ref/${fam}`) + "-*", steps }));

  // Scheme: group ui/* by family, show light/dark
  const schemeFam = new Map<string, SemanticItem[]>();
  for (const [n, l, d] of ui) {
    const parts = n.split("/");
    const fam = parts.slice(1, -1).join("/");
    if (!schemeFam.has(fam)) schemeFam.set(fam, []);
    schemeFam.get(fam)!.push({ name: parts[parts.length - 1], light: cssVar(n), dark: cssVar(n), lightHex: refHex.get(strip(l)) ?? "", darkHex: refHex.get(strip(d)) ?? "" });
  }
  const scheme: SemanticGroup[] = [...schemeFam].map(([fam, items]) => ({ title: fam, prefix: cssVar(`ui/${fam}`) + "-*", items }));

  // Semantics: group by role (text, background, border, icon, surface, link, outline)
  const roles = new Map<string, SemanticItem[]>();
  for (const [n, l, d] of sem) {
    const [role, ...rest] = n.split("/");
    if (!roles.has(role)) roles.set(role, []);
    roles.get(role)!.push({ name: rest.join("/") || "default", light: cssVar(n), dark: cssVar(n), lightHex: uiHex(l, "l"), darkHex: uiHex(d, "d") });
  }
  const order = ["surface", "background", "text", "icon", "border", "link", "outline"];
  const semantics: SemanticGroup[] = order.filter((r) => roles.has(r)).map((r) => ({ title: r, prefix: cssVar(`${r}/x`).replace("-x", "-*"), items: roles.get(r)! }));

  return { ramps, scheme, semantics };
}
