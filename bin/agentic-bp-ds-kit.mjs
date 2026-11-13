#!/usr/bin/env node
import { parseArgs } from "node:util";

export const MCP_HELP = `Usage: agentic-bp-ds-kit mcp

Start a read-only MCP server on stdio for the Agentic BP Design System repo.
Cursor and Claude Code spawn this command and query contracts and tokens locally.

Tools:
  list           Every component and pattern in contracts/index.json
                 Optional level: atom, molecule, organism, template
  get            One component or pattern contract, its level and usage
  search         Match name, intent, useWhen, and related fields
  get_tokens     Semantic tokens from src/tokens/source/semantic.txt
  get_rules      Kit agent rules (CLAUDE.md / AGENTS.md)

Options:
  -h, --help     Show this help`;

const HELP = `Usage: agentic-bp-ds-kit <command>

Commands:
  mcp            Start the read-only stdio MCP server (see: agentic-bp-ds-kit mcp --help)

Run from the kit repo root (this repository).`;

function die(message, code = 1) {
  console.error(`agentic-bp-ds-kit: ${message}`);
  process.exit(code);
}

async function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (!command || command === "-h" || command === "--help") {
    console.log(HELP);
    process.exit(0);
  }

  if (command !== "mcp") {
    die(`unknown command "${command}". Try --help.`);
  }

  const rest = argv.slice(1);
  if (rest.includes("-h") || rest.includes("--help")) {
    console.log(MCP_HELP);
    process.exit(0);
  }
  if (rest.length > 0) {
    die(`unknown mcp option "${rest[0]}". Try mcp --help.`);
  }

  const { startMcpServer } = await import("./mcp.mjs");
  await startMcpServer();
}

main().catch((error) => {
  die(error instanceof Error ? error.message : String(error));
});
