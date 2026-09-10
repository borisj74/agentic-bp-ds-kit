import index from "../../contracts/index.json";

export const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
// Sidebar and gallery list components A to Z, whatever order the index uses.
export const components = [...index.components].sort((a, b) => a.name.localeCompare(b.name));
export const patterns = index.patterns as { name: string; contract: string }[];
