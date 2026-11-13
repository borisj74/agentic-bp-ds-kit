import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountFlow, type AccountFlowView } from "@/patterns/AccountFlow/AccountFlow";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { FormPage } from "@/patterns/FormPage/FormPage";
import { ListPage } from "@/patterns/ListPage/ListPage";
import { RecordPage } from "@/patterns/RecordPage/RecordPage";
import { Form } from "@/ui/Form/Form";
import { Input } from "@/ui/Input/Input";
import { BOOT_HOLD_MS, BOOT_LINE_MS, BOOT_SETTLE_MS } from "@/ui/LoadingLine/boot";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Table } from "@/ui/Table/Table";
import { AccountFlowDemo } from "@/playground/demos";
import { BootPlayer } from "@/playground/BootPlayer";

// AccountFlow boots the page that is showing: it hands loading to that page, so the list, the account and the
// forms each draw their own skeleton, on the same line / hold / settle sequence as every other pattern page.

const tick = async (ms: number) => { await act(async () => { vi.advanceTimersByTime(ms); }); };
// What is drawn on screen: a booting PageHeader keeps its name in a visually hidden h1, so the page still has a
// heading, and that is left out here.
const text = () => {
  const copy = document.body.cloneNode(true) as HTMLElement;
  copy.querySelectorAll(".srOnly").forEach((n) => n.remove());
  return copy.textContent ?? "";
};
// The Skeleton bars themselves.
const bars = () => document.querySelectorAll('span[aria-busy="true"]');
// Everything the keyboard could reach in the page, if the page were not held inert.
const focusable = (root: ParentNode) =>
  Array.from(root.querySelectorAll<HTMLElement>("a[href], button, input, select, textarea, [tabindex]:not([tabindex='-1'])"));

const ROWS = [{ id: "72097", name: "Chris Test Account" }, { id: "72093", name: "Andre60" }];
const flow = (view: AccountFlowView, loading: boolean) => (
  <AccountFlow
    view={view} loading={loading} loadingLabel="Loading accounts"
    list={
      <ListPage label="Accounts">
        <Table columns={[{ key: "id", header: "Account ID" }, { key: "name", header: "Account name" }]} rows={ROWS} />
      </ListPage>
    }
    account={
      <RecordPage label="Account" header={<PageHeader title="Anton Test BI Aug05" />}>
        <p>Account information</p>
      </RecordPage>
    }
    newAccount={
      <FormPage label="New account" header={<PageHeader title="New account" />}>
        <Form id="new" sections={[{ title: "Account information", content: <Input label="Account name" name="name" /> }]} />
      </FormPage>
    }
    newProduct={
      <FormPage label="New account product" header={<PageHeader title="New account product" />}>
        <Form id="product" sections={[{ title: "Product", content: <Input label="Product" name="product" /> }]} />
      </FormPage>
    }
  />
);

describe("each start view boots as its own page", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("draws the list's own skeleton, not the real accounts", async () => {
    render(<AccountFlowDemo start="list" loading />);
    await tick(BOOT_LINE_MS + 1);
    expect(text()).not.toContain("Chris Test Account");
    // The table is still a table, with its head and the row shape the accounts will land in.
    expect(document.querySelectorAll("main table tr").length).toBeGreaterThan(1);
    expect(bars().length).toBeGreaterThan(0);
  });

  it("draws the account's own skeleton, not its name or values", async () => {
    render(<AccountFlowDemo start="account" loading />);
    await tick(BOOT_LINE_MS + 1);
    expect(text()).not.toContain("Anton Test BI Aug05");
    // The record's own sections keep their headers while their bodies are bars.
    expect(document.querySelectorAll("main h2").length).toBeGreaterThan(0);
    expect(bars().length).toBeGreaterThan(0);
  });

  it.each(["newAccount", "newProduct"] as const)("draws %s's own form skeleton, not its fields", async (start) => {
    render(<AccountFlowDemo start={start} loading />);
    await tick(BOOT_LINE_MS + 1);
    expect(document.querySelectorAll("main input, main select, main textarea")).toHaveLength(0);
    expect(document.querySelectorAll("main h2").length).toBeGreaterThan(0);
    expect(bars().length).toBeGreaterThan(0);
  });

  it("gives the page back once it has arrived", async () => {
    const view = render(<AccountFlowDemo start="list" loading />);
    await tick(BOOT_LINE_MS + 1);
    view.rerender(<AccountFlowDemo start="list" loading={false} />);
    await tick(BOOT_HOLD_MS + BOOT_SETTLE_MS);
    expect(screen.getByText("Chris Test Account")).toBeInTheDocument();
  });
});

describe("the flow hands loading to the page that is showing", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const inShell = (view: AccountFlowView, loading: boolean) => (
    <AppShell loading={loading} loadingLabel="Loading accounts">{flow(view, loading)}</AppShell>
  );

  it("boots a page's own PageHeader too, which the frame cannot reach", async () => {
    render(inShell("account", true));
    await tick(BOOT_LINE_MS + 1);
    // The title is a bar now, and the h1 keeps its place.
    expect(text()).not.toContain("Anton Test BI Aug05");
    expect(document.querySelector("h1")).not.toBeNull();
  });

  it("keeps nothing reachable by the keyboard while it is bars", async () => {
    for (const view of ["list", "account", "newAccount", "newProduct"] as const) {
      const r = render(inShell(view, true));
      await tick(BOOT_LINE_MS + 1);
      const main = document.querySelector("main")!;
      for (const el of focusable(main)) expect(el.closest("[inert]")).not.toBeNull();
      r.unmount();
    }
  });

  it("says what is loading once, in the frame", async () => {
    render(inShell("newAccount", true));
    await tick(BOOT_LINE_MS + 1);
    expect(screen.getAllByRole("status").map((s) => s.textContent)).toEqual(["Loading accounts"]);
  });
});

describe("outside a frame the flow runs the same sequence itself", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the line alone for 200ms, then the page's skeleton", async () => {
    render(flow("list", true));
    expect(screen.getByRole("progressbar", { name: "Loading accounts" })).toBeInTheDocument();
    expect(bars()).toHaveLength(0);
    await tick(BOOT_LINE_MS);
    expect(bars().length).toBeGreaterThan(0);
    expect(text()).not.toContain("Chris Test Account");
    for (const el of focusable(document.body)) expect(el.closest("[inert]")).not.toBeNull();
  });

  it("never draws a skeleton when the page lands inside the first 200ms", async () => {
    const view = render(flow("newAccount", true));
    await tick(120);
    view.rerender(flow("newAccount", false));
    await tick(BOOT_LINE_MS + BOOT_HOLD_MS);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(document.querySelectorAll("input")).toHaveLength(1);
    expect(document.querySelector("[inert]")).toBeNull();
  });

  it("holds the skeleton its full 400ms, then fades the page in", async () => {
    const view = render(flow("list", true));
    await tick(BOOT_LINE_MS);
    view.rerender(flow("list", false));
    await tick(BOOT_HOLD_MS - 1);
    expect(text()).not.toContain("Chris Test Account");
    await tick(1);
    expect(screen.getByText("Chris Test Account")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    await tick(BOOT_SETTLE_MS);
  });
});

describe("BootPlayer drives the flow on the frame's clock", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const played = (speed: "fast" | "typical") => (
    <BootPlayer speed={speed}>{(loading) => <AccountFlowDemo start="list" loading={loading} />}</BootPlayer>
  );

  it("typical: the line, the list's skeleton held until the data, then the accounts", async () => {
    render(played("typical"));
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(bars()).toHaveLength(0);
    await tick(BOOT_LINE_MS + 1);
    expect(bars().length).toBeGreaterThan(0);
    expect(text()).not.toContain("Chris Test Account");
    // The data lands at 900ms, past the 600ms the hold asks for, so the skeleton stays until then.
    await tick(600);
    expect(text()).not.toContain("Chris Test Account");
    // Each step starts its own timer once the last has run, so the clock is moved one step at a time.
    await tick(100);
    await tick(0);
    await tick(BOOT_SETTLE_MS);
    expect(screen.getByText("Chris Test Account")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("fast: the data lands at 120ms, so no skeleton is ever drawn", async () => {
    render(played("fast"));
    for (let t = 0; t < BOOT_LINE_MS + BOOT_HOLD_MS; t += 20) {
      expect(bars()).toHaveLength(0);
      await tick(20);
    }
    expect(screen.getByText("Chris Test Account")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
