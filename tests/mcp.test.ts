import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const repoRoot = resolve(import.meta.dirname, "..");
const mcpEntry = resolve(repoRoot, "bin/mcp.mjs");
const cliEntry = resolve(repoRoot, "bin/agentic-bp-ds-kit.mjs");

const TOOL_NAMES = ["get", "get_rules", "get_tokens", "list", "search"];

let client: Client;
let transport: StdioClientTransport;

type ToolTextResult = { content?: { type: string; text?: string }[] };

function textOf(result: unknown) {
  const { content } = result as ToolTextResult;
  const block = content?.find((item) => item.type === "text");
  expect(block?.text).toBeTypeOf("string");
  return block!.text!;
}

async function callTool<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const result = await client.callTool({ name, arguments: args });
  expect(result.isError).not.toBe(true);
  return JSON.parse(textOf(result)) as T;
}

describe("MCP server", () => {
  beforeAll(async () => {
    transport = new StdioClientTransport({
      command: process.execPath,
      args: [mcpEntry],
      cwd: repoRoot,
      stderr: "pipe",
    });
    const stderr = transport.stderr as unknown as NodeJS.ReadableStream | undefined;
    stderr?.resume?.();
    client = new Client({ name: "agentic-bp-ds-kit-mcp-test", version: "0.0.0" });
    await client.connect(transport);
  }, 30_000);

  afterAll(async () => {
    await client?.close();
  });

  it("exposes the five read-only tools", async () => {
    const listed = await client.listTools();
    expect(listed.tools.map((tool) => tool.name).sort()).toEqual(TOOL_NAMES);
    for (const tool of listed.tools) {
      expect(tool.description?.length ?? 0).toBeGreaterThan(20);
      expect(tool.annotations?.readOnlyHint).toBe(true);
    }
  });

  it("list returns components and patterns from the index", async () => {
    const data = await callTool<{
      count: number;
      components: { name: string; kind: string }[];
      patterns: { name: string; kind: string }[];
    }>("list");
    expect(data.count).toBeGreaterThan(70);
    expect(data.components.some((row) => row.name === "Button")).toBe(true);
    expect(data.components.every((row) => row.kind === "component")).toBe(true);
    // The kit's first rule for a screen is to use the pattern that covers it, so patterns have to be visible here.
    expect(data.patterns.some((row) => row.name === "ListPage")).toBe(true);
    expect(data.patterns.every((row) => row.kind === "pattern")).toBe(true);
    expect(data.count).toBe(data.components.length + data.patterns.length);
  });

  it("get returns the Button contract", async () => {
    const data = await callTool<{
      name: string;
      contract: { name: string; props: Record<string, unknown> };
      import: string;
    }>("get", { name: "Button" });
    expect(data.name).toBe("Button");
    expect(data.contract.name).toBe("Button");
    expect(data.contract.props.emphasis).toBeDefined();
    expect(data.import).toContain("@/ui/Button/Button");
  });

  it("get returns a pattern with its own import path", async () => {
    const data = await callTool<{
      name: string;
      kind: string;
      contract: { name: string };
      import: string;
    }>("get", { name: "listpage" });
    expect(data.name).toBe("ListPage");
    expect(data.kind).toBe("pattern");
    expect(data.contract.name).toBe("ListPage");
    expect(data.import).toContain("@/patterns/ListPage/ListPage");
  });

  it("search matches useWhen and intent text, across both kinds", async () => {
    const byName = await callTool<{ components: { name: string }[] }>("search", { query: "button" });
    expect(byName.components.some((row) => row.name === "Button")).toBe(true);

    const patterns = await callTool<{ patterns: { name: string; kind: string }[] }>("search", {
      query: "record",
    });
    expect(patterns.patterns.some((row) => row.name === "RecordPage")).toBe(true);

    const empty = await callTool<{ count: number; components: unknown[]; patterns: unknown[] }>("search", {
      query: "zzzz-not-in-kit",
    });
    expect(empty.count).toBe(0);
    expect(empty.patterns).toHaveLength(0);
  });

  it("get_tokens reads semantic.txt with filters", async () => {
    const all = await callTool<{ count: number; tokens: { name: string; light: string; dark: string }[] }>(
      "get_tokens",
    );
    expect(all.count).toBeGreaterThan(100);
    expect(all.tokens[0].name.startsWith("--")).toBe(true);

    const textOnly = await callTool<{ category: string; count: number }>("get_tokens", {
      category: "text",
      theme: "light",
    });
    expect(textOnly.category).toBe("text");
    expect(textOnly.count).toBeGreaterThan(10);
  });

  it("get_rules returns essentials and document text", async () => {
    const rules = await callTool<{ rules: string[]; documents: Record<string, string> }>("get_rules");
    expect(rules.rules.length).toBeGreaterThan(5);
    expect(rules.rules.some((line) => line.includes("semantic"))).toBe(true);
    expect(rules.documents["CLAUDE.md"]?.includes("Never invent")).toBe(true);
  });
});

describe("MCP CLI", () => {
  it("prints mcp help", () => {
    const help = spawnSync(process.execPath, [cliEntry, "mcp", "--help"], {
      encoding: "utf8",
      cwd: repoRoot,
    });
    expect(help.status).toBe(0);
    expect(help.stdout).toMatch(/get_tokens/);
    expect(help.stdout).toMatch(/\blist\b/);
  });
});
