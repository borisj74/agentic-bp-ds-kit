import { readFile } from "node:fs/promises";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyPrompt } from "@/playground/CopyPrompt";
import type { Contract } from "@/playground/Master";

async function buttonContract() {
  const raw = await readFile(path.join(process.cwd(), "contracts/button.json"), "utf8");
  return JSON.parse(raw) as Contract;
}

describe("CopyPrompt", () => {
  const writeText = vi.fn((_text: string) => Promise.resolve());
  const open = vi.fn();

  // userEvent.setup() installs a clipboard stub of its own, so the spy goes in after it.
  const setup = () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    vi.stubGlobal("open", open);
    return user;
  };

  beforeEach(() => {
    writeText.mockClear();
    open.mockClear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("copies the prompt and clears the mark after a moment", async () => {
    const contract = await buttonContract();
    const user = setup();
    render(<CopyPrompt contract={contract} />);

    await user.click(screen.getByRole("button", { name: /^copy$/i }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('import { Button } from "@/ui/Button/Button"');
    expect(open).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /copied/i })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toMatch(/copied/i);

    // The shared helper clears its own mark; the component keeps no timer of its own.
    await vi.waitFor(() => expect(screen.getByRole("button", { name: /^copy$/i })).toBeTruthy(), { timeout: 2500 });
  });

  it("copies and opens the tool, with the prompt in the query string", async () => {
    const contract = await buttonContract();
    const user = setup();
    render(<CopyPrompt contract={contract} />);

    await user.click(screen.getByRole("button", { name: /open in Cursor/i }));
    expect(writeText).toHaveBeenCalledTimes(1);
    const prompt = writeText.mock.calls[0][0];
    expect(prompt).toContain("@contracts/button.json");
    expect(open).toHaveBeenCalledTimes(1);
    const [url, target, features] = open.mock.calls[0];
    expect(url).toBe(`https://cursor.com/link/prompt?text=${encodeURIComponent(prompt)}`);
    expect(target).toBe("_blank");
    expect(features).toContain("noopener");
  });

  it("opens every tool, and MCP opens the catalog's own MCP page", async () => {
    const contract = await buttonContract();
    const user = setup();
    render(<CopyPrompt contract={contract} />);

    for (const [name, host] of [
      [/open in Claude$/i, "claude.ai"],
      [/open in ChatGPT/i, "chatgpt.com"],
      [/open in v0/i, "v0.app"],
    ] as const) {
      open.mockClear();
      await user.click(screen.getByRole("button", { name }));
      expect(String(open.mock.calls[0][0])).toContain(host);
    }

    open.mockClear();
    await user.click(screen.getByRole("button", { name: /open the MCP page/i }));
    expect(open).toHaveBeenCalledTimes(1);
    expect(open.mock.calls[0][0]).toBe("/start/mcp");
    expect(open.mock.calls[0][1]).toBe("_blank");
    expect(writeText.mock.calls.at(-1)?.[0]).toContain("MCP tool");
  });
});
