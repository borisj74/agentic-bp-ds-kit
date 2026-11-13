import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { ListPage } from "@/patterns/ListPage/ListPage";
import { Form } from "@/ui/Form/Form";
import { Input } from "@/ui/Input/Input";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Section } from "@/ui/Section/Section";
import { Table } from "@/ui/Table/Table";
import { axeViolations } from "./axe";
import { BOOT_LINE_MS } from "@/ui/LoadingLine/boot";

// A booting AppShell boots the page too, not only the chrome: the page pattern inside it and the Sections,
// fields and tables a screen lays out itself all go to their own skeletons, and the real page is held out of
// reach while they are bars.

const COLUMNS = [
  { key: "id", header: "Invoice" },
  { key: "account", header: "Account" },
];
const ROWS = [
  { id: "INV-4471", account: "Northwind Holdings" },
  { id: "INV-4472", account: "Globex Corporation" },
];

// The skeletons are held back for the line's first 200ms, so every test here runs the clock past it.
const past = async () => { await act(async () => { vi.advanceTimersByTime(BOOT_LINE_MS + 1); }); };

const shellWithList = (loading: boolean) => (
  <AppShell loading={loading} pageHeader={<PageHeader title="Invoices" />}>
    <ListPage state="ready" label="Invoices">
      <Table columns={COLUMNS} rows={ROWS} caption="Invoices" />
    </ListPage>
  </AppShell>
);

const shellWithSections = (loading: boolean) => (
  <AppShell loading={loading} loadingLabel="Loading account" pageHeader={<PageHeader title="Northwind" />}>
    <Section title="Summary" collapsible>
      <p>Twelve invoices</p>
    </Section>
    <Section title="Billing settings" collapsible>
      <Form columns={2} labelPosition="start">
        <Input label="Account name" name="name" />
        <Input label="Cycle" name="cycle" />
      </Form>
    </Section>
  </AppShell>
);

describe("a booting AppShell boots the page inside it", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does not leave the real rows of a list standing under the line", async () => {
    render(shellWithList(true));
    await past();
    // The list's own state says ready — the frame is what is booting — and the rows still go to bars. The page
    // is hidden from screen readers while it boots, so what is in it is read off the DOM, not off the roles.
    expect(document.body.textContent).not.toContain("INV-4471");
    expect(document.body.textContent).not.toContain("Northwind Holdings");
    // The table is still a table, with its head and the row shape the records will land in.
    expect(document.querySelectorAll("table tr").length).toBeGreaterThan(1);
  });

  it("gives the rows back once the page has arrived", async () => {
    const view = render(shellWithList(true));
    await past();
    view.rerender(shellWithList(false));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText("INV-4471")).toBeInTheDocument();
  });

  it("does not leave a screen's own fields standing either", async () => {
    render(shellWithSections(true));
    await past();
    expect(document.querySelectorAll("input")).toHaveLength(0);
    // Each Section keeps its header and its name, with a bar where the words will be.
    expect(document.querySelectorAll("h2")).toHaveLength(2);
    expect(document.body.textContent).toContain("Summary");
    expect(document.querySelectorAll('.booting [aria-busy="true"]').length).toBeGreaterThan(0);
  });

  it("holds the page inert and away from screen readers while it boots", async () => {
    render(shellWithSections(true));
    await past();
    const page = document.querySelector(".booting") as HTMLElement;
    expect(page).toBeTruthy();
    expect(page.hasAttribute("inert")).toBe(true);
    expect(page.getAttribute("aria-hidden")).toBe("true");
    // Nothing inside it can be tabbed to.
    expect(page.querySelectorAll("button, a[href], input, [tabindex]")).toHaveLength(0);
  });

  it("reads out one status, the frame's own label", async () => {
    render(shellWithList(true));
    await past();
    const status = screen.getAllByRole("status");
    expect(status).toHaveLength(1);
    expect(status[0]).toHaveTextContent("Loading page");
  });

  it("names what is loading when the screen says so", async () => {
    render(shellWithSections(true));
    await past();
    expect(screen.getByRole("status")).toHaveTextContent("Loading account");
  });

  it("sits under the header's border with its track showing, as the Cobalt boot frames draw it", async () => {
    render(shellWithList(true));
    const line = screen.getByRole("progressbar");
    expect(line.className).not.toContain("bare");
    expect(document.querySelector(".loadingLine")).toBeTruthy();
  });

  it("adds no page skeleton of its own: the wrapper is the page's own box", async () => {
    render(shellWithSections(true));
    await past();
    // display: contents, so the content column's gap between Sections is unchanged.
    expect(document.querySelector(".booting")?.children).toHaveLength(2);
  });

});

describe("the booting frame's accessibility", () => {
  // axe walks the tree itself, so this one runs on the real clock.
  it("has no problems while the page boots", async () => {
    render(shellWithSections(true));
    await act(async () => { await new Promise((done) => setTimeout(done, BOOT_LINE_MS + 50)); });
    expect(document.querySelector(".booting")).toBeTruthy();
    expect(await axeViolations()).toEqual([]);
  });
});
