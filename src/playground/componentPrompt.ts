import type { Contract } from "./Master";
import { slug } from "./nav";

export type PromptTarget = "claude-code" | "cursor" | "mcp";

export const PROMPT_TARGETS: { value: PromptTarget; label: string }[] = [
  { value: "claude-code", label: "Claude Code" },
  { value: "cursor", label: "Cursor" },
  { value: "mcp", label: "MCP" },
];

function importLine(contract: Contract): string {
  const base = contract.path.replace(/^src\//, "@/").replace(/\.tsx?$/, "");
  return `import { ${contract.name} } from "${base}";`;
}

function formatDefault(value: unknown): string {
  if (typeof value === "string") return value.length === 0 ? '""' : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function keyPropLines(contract: Contract): string[] {
  return Object.entries(contract.props).flatMap(([name, spec]) => {
    if (spec.enum?.length) {
      const def = spec.default !== undefined ? ` (default: ${formatDefault(spec.default)})` : "";
      const note = spec.note ? ` — ${spec.note}` : "";
      return [`- ${name}: ${spec.enum.join(" | ")}${def}${note}`];
    }
    if (spec.type === "boolean") {
      const def = spec.default !== undefined ? ` (default: ${formatDefault(spec.default)})` : "";
      return [`- ${name}: boolean${def}`];
    }
    if (spec.required) return [`- ${name}: required${spec.note ? ` — ${spec.note}` : ""}`];
    return [];
  });
}

/** Ready-to-paste agent prompt for one kit contract. */
export function componentPrompt(contract: Contract, target: PromptTarget): string {
  const id = slug(contract.name);
  const contractPath = `contracts/${id}.json`;

  const source =
    target === "mcp"
      ? `Call the Agentic BP DS MCP tool \`get\` with name "${id}" and follow what it returns. Other read-only tools: list, search, get_tokens, get_rules.`
      : target === "cursor"
        ? `Read @${contractPath} before writing code. Open contracts/index.json when you need the catalog.`
        : `Read ${contractPath} before writing code. Open contracts/index.json when you need the catalog.`;

  const lines = [
    `Build with the Agentic BP Design System ${contract.name}. ${source}`,
    "",
    importLine(contract),
    "",
    `Intent: ${contract.intent}`,
    contract.snippet ? `Snippet from contract:\n${contract.snippet}` : "",
    "",
    "Key props / variants:",
    ...keyPropLines(contract),
    "",
    "Kit rules (always):",
    "- Use only Agentic BP DS components from @/ui/<Name> and patterns from @/patterns/ — never invent a local cousin.",
    "- Style with semantic CSS variables from src/tokens/semantic.css only — no hex, no primitive --ref-* / --ui-* ramps.",
    '- One strong brand Button per view: emphasis="strong" intent="brand".',
    "- Page spacing: layout classes in src/tokens/layout.css (.layout-content, .layout-stack, .layout-split, …).",
    "- Icons: Material Symbols through the kit Icon component only.",
  ];

  if (contract.useWhen?.length) {
    lines.push("", "Use when:", ...contract.useWhen.map((rule) => `- ${rule}`));
  }
  if (contract.doNot?.length) {
    lines.push("", "Do not:", ...contract.doNot.map((rule) => `- ${rule}`));
  }
  if (contract.a11y?.length) {
    lines.push("", "Accessibility:", ...contract.a11y.map((rule) => `- ${rule}`));
  }

  return lines
    .join("\n")
    .replace(/\n\n\n+/g, "\n\n")
    .trim();
}
