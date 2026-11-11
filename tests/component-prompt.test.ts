import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Contract } from "@/playground/Master";
import { componentPrompt } from "@/playground/componentPrompt";

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
});
