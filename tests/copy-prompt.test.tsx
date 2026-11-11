import { readFile } from "node:fs/promises";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CopyPrompt } from "@/playground/CopyPrompt";
import type { Contract } from "@/playground/Master";

async function buttonContract() {
  const raw = await readFile(path.join(process.cwd(), "contracts/button.json"), "utf8");
  return JSON.parse(raw) as Contract;
}

describe("CopyPrompt", () => {
  const writeText = vi.fn((_text: string) => Promise.resolve());

  // userEvent.setup() installs a clipboard stub of its own, so the spy goes in after it.
  const setup = () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    return user;
  };

  beforeEach(() => writeText.mockClear());

  it("copies the prompt for the chosen target and clears the mark after a moment", async () => {
    const contract = await buttonContract();
    const user = setup();
    render(<CopyPrompt contract={contract} />);

    await user.click(screen.getByRole("button", { name: /copy/i }));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain('import { Button } from "@/ui/Button/Button"');
    expect(screen.getByRole("button", { name: /copied/i })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toMatch(/copied/i);

    // The shared helper clears its own mark; the component keeps no timer of its own.
    await vi.waitFor(() => expect(screen.getByRole("button", { name: /^copy$/i })).toBeTruthy(), { timeout: 2500 });
  });

  it("asks to be copied again when the target changes", async () => {
    const contract = await buttonContract();
    const user = setup();
    render(<CopyPrompt contract={contract} />);

    await user.click(screen.getByRole("button", { name: /copy/i }));
    expect(screen.getByRole("button", { name: /copied/i })).toBeTruthy();

    await user.click(screen.getByRole("radio", { name: /claude code/i }));
    expect(screen.getByRole("button", { name: /^copy$/i })).toBeTruthy();
  });
});
