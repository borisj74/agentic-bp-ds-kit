/**
 * Agentic BP DS — stdio MCP server. stdout is the protocol; do not log there.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { LEVELS } from "../scripts/sync-index.mjs";
import { RULES, reviewFiles, reviewSource, summarize } from "../scripts/review/index.mjs";
import {
  CatalogError,
  TOKEN_CATEGORIES,
  getComponent,
  getRules,
  getTokens,
  listComponents,
  repoRoot,
  searchComponents,
} from "../mcp/catalog.mjs";

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

function kitVersion() {
  const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  return String(pkg.version ?? "0.0.0");
}

function register(server, name, config, fn) {
  server.registerTool(name, { ...config, annotations: READ_ONLY }, async (args) => {
    try {
      const data = fn(args ?? {});
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        structuredContent: data,
      };
    } catch (error) {
      if (error instanceof CatalogError) {
        return { isError: true, content: [{ type: "text", text: error.message }] };
      }
      throw error;
    }
  });
}

function createServer() {
  const version = kitVersion();
  const server = new McpServer(
    { name: "agentic-bp-ds-kit", version },
    {
      instructions:
        "Read-only catalog of the Agentic BP Design System repo this process was started from. " +
        "Use list, get, search, get_tokens, and get_rules before building UI. "
        + "Reuse the biggest piece that fits: pattern (template), then organism, molecule, atom. " +
        "Do not invent a component, prop, or token that these tools do not return. " +
        "Run review_ui before you hand a screen back, and fix the errors it reports.",
    },
  );

  register(
    server,
    "list",
    {
      title: "List components and patterns",
      description:
        `List every UI component and every screen pattern in contracts/index.json, each with its kind, level, category, contract path, tags, and a one-line intent. Pass level to list one level only (${LEVELS.join(", ")}): template returns the patterns, the others return components. Start from the biggest piece that fits — pattern (template), then organism, molecule, atom.`,
      inputSchema: {
        level: z
          .string()
          .optional()
          .describe(`One level only: ${LEVELS.join(", ")}. Leave it out for everything.`),
      },
    },
    ({ level }) => listComponents({ level }),
  );

  register(
    server,
    "get",
    {
      title: "Get a component or pattern",
      description:
        "Get one component or screen pattern by display name or contract file stem (Button, button, ListPage, listpage). Returns the full contract JSON, its kind, its level, a usage summary, and the import path to use.",
      inputSchema: {
        name: z.string().describe("Component or pattern name, or contract id: Button, datagrid, ListPage."),
      },
    },
    ({ name }) => getComponent(name),
  );

  register(
    server,
    "search",
    {
      title: "Search components and patterns",
      description:
        "Find components and screen patterns whose name, category, tags, intent, usage, useWhen, or doNot lines match every word in the query (case-insensitive). Matches come back split by kind, each with its level.",
      inputSchema: {
        query: z.string().describe('Words to match, e.g. "icon only" or "destructive confirm".'),
      },
    },
    ({ query }) => searchComponents(query),
  );

  const tokenCategory = z
    .enum(TOKEN_CATEGORIES)
    .optional()
    .describe(`Semantic token category from src/tokens/source/semantic.txt: ${TOKEN_CATEGORIES.join(", ")}.`);

  const tokenTheme = z
    .enum(["light", "dark", "both"])
    .optional()
    .describe('Which theme values to return. Default "both".');

  register(
    server,
    "get_tokens",
    {
      title: "Get semantic tokens",
      description:
        "Semantic color roles from src/tokens/source/semantic.txt (also built into src/tokens/semantic.css). Filter by category and theme.",
      inputSchema: {
        category: tokenCategory,
        theme: tokenTheme,
      },
    },
    (args) => getTokens(args),
  );

  register(
    server,
    "get_rules",
    {
      title: "Get kit rules",
      description:
        "Agent rules for this kit: use existing components and patterns only, never invent cousins, use semantic tokens not primitives. Includes CLAUDE.md and AGENTS.md text.",
    },
    () => getRules(),
  );

  register(
    server,
    "review_ui",
    {
      title: "Review a screen against the contracts",
      description:
        `Review a screen built from this kit and get back what drifts from its contracts: raw colours and spacing, primitive tokens, local cousins, props and values outside a closed enum, more than one strong brand Button, and the bigger piece to reuse. Pass path for a file or folder in the repo, or code for a draft you have not saved yet (with filename, so the screen rules apply). Rules: ${RULES.join(", ")}. Run this before you hand a screen back and fix the errors.`,
      inputSchema: {
        path: z.string().optional().describe("File or folder in the repo, like src/app/invoices/page.tsx."),
        code: z.string().optional().describe("The source of a draft you have not saved yet."),
        filename: z
          .string()
          .optional()
          .describe('Where the draft will be saved, like "src/app/invoices/page.tsx". Default "draft.tsx".'),
        all: z.boolean().optional().describe("Include the kit's own folders (src/ui, src/patterns, src/tokens, tests)."),
      },
    },
    ({ path, code, filename, all }) => {
      if (typeof code === "string" && code.length > 0) {
        const file = filename && filename.trim() ? filename.trim() : "draft.tsx";
        const findings = reviewSource(code, file);
        return { summary: summarize({ files: [file], findings }), files: [file], rules: RULES, findings };
      }
      if (!path || !path.trim()) throw new CatalogError("Pass path (a file or folder in the repo) or code (a draft).");
      let result;
      try {
        result = reviewFiles([path.trim()], { all: Boolean(all) });
      } catch (error) {
        throw new CatalogError(`Cannot review "${path}": ${error instanceof Error ? error.message : String(error)}`);
      }
      return { summary: summarize(result), files: result.files, rules: RULES, findings: result.findings };
    },
  );

  return server;
}

export async function startMcpServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  startMcpServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
