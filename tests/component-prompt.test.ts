import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Contract } from "@/playground/Master";
import { readdir } from "node:fs/promises";
import { PROMPT_TARGETS, URL_LIMIT, componentPrompt, promptUrl } from "@/playground/componentPrompt";

describe("componentPrompt", () => {
  it("includes import, rules, and MCP get tool for Button", async () => {
    const raw = await readFile(path.join(process.cwd(), "contracts/button.json"), "utf8");
    const contract = JSON.parse(raw) as Contract;
    const mcp = componentPrompt(contract, "mcp");
    expect(mcp).toContain('import { Button } from "@/ui/Button/Button"');
    expect(mcp).toContain('`get` with name "button"');
    expect(mcp).toContain("list, search, get_tokens, get_rules");
    expect(mcp).toContain("Agentic BP DS");
    expect(mcp).toContain("emphasis:");
    expect(mcp).toContain("Do not:");
    const cursor = componentPrompt(contract, "cursor");
    expect(cursor).toContain("@contracts/button.json");
    const claude = componentPrompt(contract, "claude-code");
    expect(claude).toContain("contracts/button.json");
    expect(claude).not.toContain("@contracts/");
  });

  it("writes ChatGPT and v0 a prompt that sends nobody to a file", async () => {
    const raw = await readFile(path.join(process.cwd(), "contracts/button.json"), "utf8");
    const contract = JSON.parse(raw) as Contract;
    for (const target of ["chatgpt", "v0"] as const) {
      const text = componentPrompt(contract, target);
      expect(text).toContain("no repo to open");
      expect(text).toContain("https://agentic-bp-ds-kit.vercel.app");
      expect(text).not.toContain("Read contracts/");
      expect(text).not.toContain("@contracts/");
      // The kit rules ride along whatever the target is.
      expect(text).toContain("Kit rules (always):");
      expect(text).toContain("src/tokens/semantic.css");
    }
  });

  it("opens the tool empty rather than with half a prompt when the URL would be too long", async () => {
    const open = PROMPT_TARGETS.find((tool) => tool.value === "chatgpt")?.open;
    expect(open).toBeTruthy();
    if (!open) return;
    expect(promptUrl(open, "short")).toBe(`${open.href}?${open.param}=short`);
    expect(promptUrl(open, "x".repeat(URL_LIMIT))).toBe(open.fallback);
  });

  it("keeps every contract's URL inside the ceiling or falls back", async () => {
    const dir = path.join(process.cwd(), "contracts");
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json") && f !== "index.json");
    for (const file of files) {
      const contract = JSON.parse(await readFile(path.join(dir, file), "utf8")) as Contract;
      if (!contract.props) continue;
      for (const tool of PROMPT_TARGETS) {
        if (!tool.open) continue;
        expect(promptUrl(tool.open, componentPrompt(contract, tool.value)).length).toBeLessThanOrEqual(URL_LIMIT);
      }
    }
  });
});
