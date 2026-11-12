import type { Contract } from "./Master";
import { slug } from "./nav";

export type PromptTarget = "claude-code" | "chatgpt" | "cursor" | "v0" | "mcp";

/** Where a tool button sends the prompt. `fallback` opens the tool with nothing pre-filled. */
export type PromptOpen = { href: string; param: string; fallback: string };

export type PromptTool = {
  value: PromptTarget;
  /** Shown as the button's accessible name: "Copy prompt and open in <label>". */
  label: string;
  /** The tool's own site, opened with the prompt in the URL. MCP has none: it is our own server. */
  open?: PromptOpen;
  /** A page in this catalog to open instead, for a target with no site of its own to send the prompt to. */
  page?: string;
};

export const PROMPT_TARGETS: PromptTool[] = [
  {
    value: "claude-code",
    label: "Claude",
    open: { href: "https://claude.ai/new", param: "q", fallback: "https://claude.ai/new" },
  },
  {
    value: "chatgpt",
    label: "ChatGPT",
    open: { href: "https://chatgpt.com/", param: "q", fallback: "https://chatgpt.com/" },
  },
  {
    value: "cursor",
    label: "Cursor",
    open: { href: "https://cursor.com/link/prompt", param: "text", fallback: "https://cursor.com/" },
  },
  {
    value: "v0",
    label: "v0",
    open: { href: "https://v0.app/chat", param: "q", fallback: "https://v0.app/chat" },
  },
  { value: "mcp", label: "MCP", page: "/start/mcp" },
];

/**
 * How long a pre-filled prompt may be, counted on the whole encoded URL.
 *
 * Browsers take far more (Chrome ~2 MB), but the receiving site has to carry the text through a redirect and a
 * sign-in hop, and the usual server and CDN ceiling for one request line is 8 KB — past it a proxy answers 414
 * rather than the tool. 8000 characters sits just inside that. Most of the kit clears it easily; the three
 * heaviest contracts do not (BarChart encodes to about 10 KB, DataGrid and Cell to about 8.8 KB), and those
 * buttons open the tool empty. The clipboard still has the whole prompt, which beats handing the tool half of one.
 */
export const URL_LIMIT = 8000;

/** The URL a tool button opens: with the prompt when it fits, else the tool's own front door. */
export function promptUrl(open: PromptOpen, prompt: string): string {
  const url = `${open.href}?${open.param}=${encodeURIComponent(prompt)}`;
  return url.length <= URL_LIMIT ? url : open.fallback;
}

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

const CATALOG_URL = "https://agentic-bp-ds-kit.vercel.app";
const REPO_URL = "https://github.com/borisj74/agentic-bp-ds-kit";

/** Ready-to-paste agent prompt for one kit contract. */
export function componentPrompt(contract: Contract, target: PromptTarget): string {
  const id = slug(contract.name);
  const contractPath = `contracts/${id}.json`;

  // ChatGPT and v0 get the prompt in a chat with no checkout behind it, so theirs never sends the reader to a file.
  const standalone = target === "chatgpt" || target === "v0";
  const source =
    target === "mcp"
      ? `Call the Agentic BP DS MCP tool \`get\` with name "${id}" and follow what it returns. Other read-only tools: list, search, get_tokens, get_rules.`
      : target === "cursor"
        ? `Read @${contractPath} before writing code. Open contracts/index.json when you need the catalog.`
        : standalone
          ? `There is no repo to open in this chat: everything the contract says is below, so work from it. The kit is public — catalog at ${CATALOG_URL}, source at ${REPO_URL}, scaffold with \`npm create agentic-bp-ds@latest\`.`
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

  if (standalone) {
    lines.push(
      "",
      "If this chat has no copy of the kit, keep the same component name, prop names and enum values as above, and",
      "keep the semantic CSS variable names — do not swap them for hex, a utility framework or another library.",
    );
  }

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
