import { readFileSync } from "node:fs";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { ListPage } from "@/patterns/ListPage/ListPage";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import {
  BOOT_HOLD_MS, BOOT_LINE_MS, BOOT_SETTLE_MS, BootContext, useBootPhase, useBootSkeleton, type BootState,
} from "@/ui/LoadingLine/boot";

// The boot sequence from the Cobalt skeleton block (DSL-199): only the loading line for 200ms, then the
// skeleton for at least 400ms, then the content fades in over 150ms.

const token = (name: string) => {
  const css = readFileSync("src/tokens/primitives.css", "utf8");
  return css.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1].trim();
};

describe("the timings", () => {
  // The hook needs numbers and the CSS needs a token, so the same three values live in two places. They are
  // allowed to, as long as they never drift.
  it.each([
    ["motion-boot-line", BOOT_LINE_MS],
    ["motion-boot-hold", BOOT_HOLD_MS],
    ["motion-boot-settle", BOOT_SETTLE_MS],
  ])("%s matches the constant the hook uses", (name, ms) => {
    expect(token(name)).toBe(`${ms}ms`);
  });
});

// The two resting points and the slower breathe come from the Cobalt components, and neither sits on the kit's
// opacity ramp, so each is a named token the animations point at rather than a number typed into a keyframe.
describe("the boot state's resting points", () => {
  const css = (file: string) => readFileSync(file, "utf8");

  it("pulses a skeleton block down to 0.55", () => {
    expect(token("opacity-skeleton-pulse")).toBe("0.55");
    expect(css("src/ui/Skeleton/Skeleton.module.css")).toContain("var(--opacity-skeleton-pulse)");
  });

  it("breathes the loading line down to 0.35 over 2s when motion is off", () => {
    expect(token("opacity-line-breathe")).toBe("0.35");
    expect(token("motion-breathe-duration")).toBe("2000ms");
    const line = css("src/ui/LoadingLine/LoadingLine.module.css");
    expect(line).toContain("var(--opacity-line-breathe)");
    expect(line).toContain("var(--motion-breathe-duration)");
  });

  it("stacks Home's two cards below 860px of the content around them", () => {
    const layout = css("src/tokens/layout.css").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");
    expect(layout).toContain(".layout-cards { container-type: inline-size;");
    expect(layout).toContain("@container (max-width: 860px) { .layout-cards > .layout-split > * { grid-column: 1 / -1; } }");
  });

  it("puts the fields in one column below 1280px of viewport, boot and real alike", () => {
    const columns = css("src/ui/Form/columns.module.css").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");
    // Above the break the box decides, so every turn that adds a column sits inside the min-width block.
    expect(columns).toContain("@media (min-width: 1280px) { @container (max-width: 1300px)");
    expect(columns).toContain("@media (max-width: 1279px) { .two, .three { grid-template-columns: minmax(0, var(--layout-column-max)); } }");
    // The skeleton follows the same break, so it never disagrees with the fields it stands in for.
    for (const file of ["src/patterns/RecordPage/RecordPage.module.css", "src/patterns/FormPage/FormPage.module.css"]) {
      expect(css(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " "))
        .toContain("@media (max-width: 1279px) { .loadingColumn.loadingColumn { grid-column: 1 / -1; } }");
    }
  });

  it("caps a booting record's and form's columns where the real fields stop", () => {
    for (const file of ["src/patterns/RecordPage/RecordPage.module.css", "src/patterns/FormPage/FormPage.module.css"]) {
      expect(css(file).replace(/\s+/g, " ")).toContain("max-width: var(--layout-column-max);");
    }
  });
});

function Phase({ loading }: { loading: boolean }) {
  const boot = useBootPhase(loading);
  return <output>{`${boot.phase}|${boot.showLine ? "line" : "-"}|${boot.showSkeleton ? "skeleton" : "-"}`}</output>;
}

const read = () => screen.getByRole("status").textContent;
const tick = async (ms: number) => { await act(async () => { vi.advanceTimersByTime(ms); }); };

describe("useBootPhase", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the line alone for the first 200ms, then the skeleton", async () => {
    render(<Phase loading />);
    expect(read()).toBe("line|line|-");
    await tick(BOOT_LINE_MS - 1);
    expect(read()).toBe("line|line|-");
    await tick(1);
    expect(read()).toBe("skeleton|line|skeleton");
  });

  it("never draws a skeleton when the data lands inside the first 200ms", async () => {
    const view = render(<Phase loading />);
    await tick(BOOT_LINE_MS - 50);
    view.rerender(<Phase loading={false} />);
    await tick(0);
    expect(read()).toBe("idle|-|-");
    // And nothing appears later either: the wait was dropped, not merely paused.
    await tick(BOOT_LINE_MS + BOOT_HOLD_MS);
    expect(read()).toBe("idle|-|-");
  });

  it("holds a skeleton its full 400ms even when the data lands straight after it", async () => {
    const view = render(<Phase loading />);
    await tick(BOOT_LINE_MS);
    expect(read()).toBe("skeleton|line|skeleton");
    view.rerender(<Phase loading={false} />);
    await tick(BOOT_HOLD_MS - 1);
    expect(read()).toBe("skeleton|line|skeleton");
    await tick(1);
    // The line goes as the content starts fading in.
    expect(read()).toBe("settling|-|-");
    await tick(BOOT_SETTLE_MS);
    expect(read()).toBe("idle|-|-");
  });

  it("counts the hold from when the skeleton was seen, not from when the load began", async () => {
    const view = render(<Phase loading />);
    await tick(BOOT_LINE_MS + 300);
    view.rerender(<Phase loading={false} />);
    await tick(BOOT_HOLD_MS - 300 - 1);
    expect(read()).toBe("skeleton|line|skeleton");
    await tick(1);
    expect(read()).toBe("settling|-|-");
  });
});

function Gate({ loading }: { loading: boolean }) {
  const { skeleton, settling } = useBootSkeleton(loading);
  return <output>{`${skeleton ? "skeleton" : "-"}|${settling ? "settling" : "-"}`}</output>;
}
const frame = (phase: BootState["phase"]): BootState => ({
  phase,
  showLine: phase === "line" || phase === "skeleton",
  showSkeleton: phase === "skeleton",
  settling: phase === "settling",
});

describe("useBootSkeleton", () => {
  it("answers loading unchanged outside a booting frame", () => {
    render(<Gate loading />);
    expect(read()).toBe("skeleton|-");
  });

  it("answers loading unchanged inside a frame that is not booting", () => {
    render(<BootContext.Provider value={frame("idle")}><Gate loading /></BootContext.Provider>);
    expect(read()).toBe("skeleton|-");
  });

  it("holds its skeleton back while the frame is still showing only the line", () => {
    render(<BootContext.Provider value={frame("line")}><Gate loading /></BootContext.Provider>);
    expect(read()).toBe("-|-");
  });

  it("draws with the frame, and fades with it", () => {
    const view = render(<BootContext.Provider value={frame("skeleton")}><Gate loading /></BootContext.Provider>);
    expect(read()).toBe("skeleton|-");
    view.rerender(<BootContext.Provider value={frame("settling")}><Gate loading /></BootContext.Provider>);
    expect(read()).toBe("-|settling");
  });

  it("never draws for a piece that is not loading, whatever the frame is doing", () => {
    render(<BootContext.Provider value={frame("skeleton")}><Gate loading={false} /></BootContext.Provider>);
    expect(read()).toBe("-|-");
  });
});

describe("AppShell runs the sequence for the page inside it", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const shell = (loading: boolean) => (
    <AppShell loading={loading} pageHeader={<PageHeader title="Invoices" />}>
      <ListPage state={loading ? "loading" : "ready"} label="Invoices">
        <p>Twelve invoices</p>
      </ListPage>
    </AppShell>
  );

  it("puts the line up at once and the skeletons only after 200ms", async () => {
    const view = render(shell(true));
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText("Loading Invoices")).not.toBeInTheDocument();
    await tick(BOOT_LINE_MS);
    expect(screen.getByText("Loading Invoices")).toBeInTheDocument();
    view.unmount();
  });

  it("takes the line down and fades the page in once the skeleton has had its hold", async () => {
    const view = render(shell(true));
    await tick(BOOT_LINE_MS);
    view.rerender(shell(false));
    await tick(BOOT_HOLD_MS);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText("Twelve invoices")).toBeInTheDocument();
  });
});
