import { readFile } from "node:fs/promises";
import path from "node:path";
import { components, patterns, slug } from "./nav";
import type { Contract } from "./Master";

// group keeps each route to its own list, so /components/<pattern> and /patterns/<component> are 404s.
export async function loadContract(s: string, group?: "components" | "patterns"): Promise<Contract | null> {
  const list = group === "components" ? components : group === "patterns" ? patterns : [...components, ...patterns];
  const entry = list.find((c) => slug(c.name) === s);
  if (!entry) return null;
  // Scoped to contracts/ so the build traces only that folder, not the whole project.
  const raw = await readFile(path.join(process.cwd(), "contracts", path.basename(entry.contract)), "utf8");
  return JSON.parse(raw) as Contract;
}
