import { readFile } from "node:fs/promises";
import path from "node:path";
import { components, slug } from "./nav";
import type { Contract } from "./Master";

export async function loadContract(s: string): Promise<Contract | null> {
  const entry = components.find((c) => slug(c.name) === s);
  if (!entry) return null;
  const raw = await readFile(path.join(process.cwd(), entry.contract), "utf8");
  return JSON.parse(raw) as Contract;
}
