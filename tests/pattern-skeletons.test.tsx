import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BarChart } from "@/ui/BarChart/BarChart";
import { Button } from "@/ui/Button/Button";
import { Card } from "@/ui/Card/Card";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { ListView } from "@/ui/ListView/ListView";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Scoreboard } from "@/ui/Scoreboard/Scoreboard";
import { Section } from "@/ui/Section/Section";
import { Table, type TableColumn } from "@/ui/Table/Table";
import { Timeline } from "@/ui/Timeline/Timeline";
import { FormLayoutContext } from "@/ui/Form/FormContext";
import { Tabs } from "@/ui/Tabs/Tabs";
import { Toolbar } from "@/ui/Toolbar/Toolbar";
import { Dashboard } from "@/patterns/Dashboard/Dashboard";
import { ListPage } from "@/patterns/ListPage/ListPage";
import { RecordPage } from "@/patterns/RecordPage/RecordPage";
import { axeViolations } from "./axe";

// Every pattern's loading skeleton follows the page's own content, the way FormPage's does: the page says once
// that its content has not arrived, and each piece under it draws itself where it will stand. loadingShape rows
// keeps each pattern's old fixed grid for a page with nothing to follow yet.

const css = (file: string) => readFileSync(file, "utf8");
const flat = (file: string) => css(file).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");
const bars = (root: ParentNode) => root.querySelectorAll('[aria-busy="true"]');
// CSS modules keep their plain local class names under test, so a class is matched by name.
const byClass = (name: string, root: ParentNode = document) => root.querySelectorAll(`[class~="${name}"]`);
// Nothing a keyboard can reach: while the page is bars, every real control is behind inert.
const reachable = () => document.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])");

const COLUMNS: TableColumn[] = [
  { key: "id", header: "Invoice" }, { key: "account", header: "Account" }, { key: "amount", header: "Amount", numeric: true },
  // Row actions: a column with nothing to name, 56 wide, like the real list's.
  { key: "actions", header: "", alignment: "end", width: "56px" },
];
const ROWS = [{ id: "1", account: "Apex", amount: "$10" }, { id: "2", account: "Borealis", amount: "$20" }];

const TABS = [
  { id: "details", label: "Details" }, { id: "contacts", label: "Contacts" },
  { id: "invoices", label: "Invoices" }, { id: "notes", label: "Notes" },
];

const KPIS = [
  { id: "ar", title: "Total AR", metric: "$1.2M", metadata: "as of today" },
  { id: "dso", title: "DSO", metric: "41 days" },
];

describe("a booting RecordPage follows its own content", () => {
  const record = (props: Partial<Parameters<typeof RecordPage>[0]> = {}) =>
    render(
      <RecordPage
        label="Account" loading tabs={<Tabs label="Record parts" items={TABS} value="contacts" />}
        toolbar={<Toolbar label="Record tools" loading onRefresh={() => {}} actions={<Button size="sm" emphasis="strong" intent="brand">Edit</Button>} />}
        summary={<Scoreboard items={KPIS} label="Record numbers" />}
        {...props}
      >
        <Section title="Account information">
          <FormDisplay label="Account name" value="Apex Digital Services" />
          <FormDisplay label="Account number" value="ACC-10428" />
        </Section>
        <Section title="Recent invoices"><Table columns={COLUMNS} rows={ROWS} /></Section>
      </RecordPage>,
    );

  it("draws one tab bar per real tab, not a fixed seven", () => {
    record();
    const strip = document.querySelector('[class*="loadingTabs"]')!;
    expect(strip.querySelectorAll('[class*="loadingTab"][class*="loadingTab"]')).toHaveLength(TABS.length);
    expect(bars(strip)).toHaveLength(TABS.length);
  });

  it("underlines the tab that is showing, and only that one", () => {
    record();
    const current = document.querySelectorAll('[class*="loadingTabCurrent"]');
    expect(current).toHaveLength(1);
    // The second tab is the one the record is on.
    const all = [...document.querySelectorAll('[class*="loadingTab"]:not([class*="loadingTabs"])')];
    expect(all.indexOf(current[0] as Element)).toBe(1);
  });

  it("draws the record's own sections, rows, numbers and table", () => {
    record();
    for (const title of ["Account Information", "Recent Invoices"]) {
      const section = screen.getByRole("region", { name: title, hidden: true });
      expect(bars(section.querySelector("h2")!)).toHaveLength(1);
    }
    // Two FormDisplay rows, each a label bar and a value bar, and no real values on screen.
    expect(document.querySelectorAll("[data-label]")).toHaveLength(2);
    expect(screen.queryByText("Apex Digital Services")).toBeNull();
    // The table draws its own head row and one row per row it has.
    const table = document.querySelector("table")!;
    expect(table.querySelectorAll("tbody tr")).toHaveLength(ROWS.length);
    // Three named columns get a name bar; the Actions column has nothing to name.
    expect(bars(table.querySelector("thead tr")!)).toHaveLength(3);
    // The scoreboard draws a card per number.
    expect(byClass("card", screen.getByRole("group", { name: "Record numbers", hidden: true }))).toHaveLength(KPIS.length);
  });

  it("keeps nothing reachable by the keyboard while it is bars", () => {
    record();
    expect(reachable()).toHaveLength(0);
    for (const inert of document.querySelectorAll("[inert]")) expect(inert).toHaveAttribute("aria-hidden", "true");
  });

  it("says what is loading once", () => {
    record();
    const status = screen.getAllByRole("status");
    expect(status).toHaveLength(1);
    expect(status[0]).toHaveTextContent("Loading Account");
  });

  it("keeps the notice's space without reading it out", () => {
    record({ notice: <p>Two invoices are past due.</p> });
    const ghost = screen.getByText("Two invoices are past due.").closest("[aria-hidden]")!;
    expect(ghost.hasAttribute("inert")).toBe(true);
  });

  it("has nothing for axe to report", async () => {
    record();
    expect(await axeViolations()).toEqual([]);
  });

  describe("loadingShape rows", () => {
    it("keeps the fixed grid instead of the details", () => {
      record({ loadingShape: "rows", loadingRows: 16 });
      expect(document.querySelectorAll("[data-label]")).toHaveLength(0);
      expect(document.querySelectorAll('[class*="loadingRow"]')).toHaveLength(16);
      expect(document.querySelectorAll('[class*="loadingColumn"]')).toHaveLength(2);
    });

    it("draws two columns even when the record asks for three", () => {
      // Regression: columns 3 drew a two-column grid of three-column rows.
      record({ loadingShape: "rows", loadingRows: 12, columns: 3 });
      expect(document.querySelectorAll('[class*="loadingColumn"]')).toHaveLength(2);
      expect(document.querySelectorAll('[class*="loadingRow"]')).toHaveLength(12);
    });

    it("draws one column when the record asks for one", () => {
      record({ loadingShape: "rows", loadingRows: 4, columns: 1 });
      expect(document.querySelectorAll('[class*="loadingColumn"]')).toHaveLength(1);
      expect(document.querySelector(".layout-split")).toBeNull();
    });

    it("gives every row a shaded 210 label cell and a 10px bar", () => {
      const record = flat("src/patterns/RecordPage/RecordPage.module.css");
      expect(record).toContain("grid-template-columns: var(--skeleton-record-label) minmax(0, 1fr)");
      expect(record).toContain("background: var(--bg-neutral-faint)");
      expect(record).toContain("height: var(--skeleton-record-row)");
    });
  });
});

describe("a booting ListPage follows the rows it was given", () => {
  const list = (props: Partial<Parameters<typeof ListPage>[0]> = {}, children?: React.ReactNode) =>
    render(
      <ListPage
        label="Invoices" state="loading"
        toolbar={<Toolbar label="Invoice tools" loading onRefresh={() => {}} actions={<Button size="sm" emphasis="strong" intent="brand">New invoice</Button>} />}
        {...props}
      >
        {children ?? <Table columns={COLUMNS} rows={ROWS} selectable rowLabel="id" />}
      </ListPage>,
    );

  it("takes its columns, their widths, its tick cell and its Actions column from the Table", () => {
    list();
    const head = document.querySelector("thead tr")!;
    // The tick cell, three named columns and the Actions column: five cells, three name bars.
    expect(head.children).toHaveLength(COLUMNS.length + 1);
    expect(bars(head)).toHaveLength(3);
    // The widths are the real table's own, not an even share.
    expect(head.lastElementChild).toHaveAttribute("style", expect.stringContaining("width: 56px"));
    expect(document.querySelector("thead .Table_select, thead [class*='select']")).not.toBeNull();
  });

  it("draws one row per row the table has, with a bar in every column", () => {
    list();
    const body = document.querySelector("tbody")!;
    expect(body.querySelectorAll("tr")).toHaveLength(ROWS.length);
    // Four columns of bars per row; the tick cell stays empty.
    expect(bars(body.querySelector("tr")!)).toHaveLength(COLUMNS.length);
  });

  it("draws a ListView's own rows and a grid of Cards' own cards", () => {
    const { unmount } = list({}, (
      <ListView label="Invoices" selection="multiple" items={[{ id: "1", primary: "INV-1", secondary: "Apex" }, { id: "2", primary: "INV-2", secondary: "Borealis" }]} />
    ));
    expect(byClass("row")).toHaveLength(2);
    expect(reachable()).toHaveLength(0);
    unmount();
    list({}, <div className="layout-metrics"><Card title="INV-1" amount="$10" /><Card title="INV-2" amount="$20" /></div>);
    expect(document.querySelectorAll("article")).toHaveLength(2);
    expect(reachable()).toHaveLength(0);
  });

  it("keeps nothing reachable by the keyboard while it is bars", () => {
    list();
    expect(reachable()).toHaveLength(0);
    expect(document.querySelector("[inert]")).toHaveAttribute("aria-hidden", "true");
  });

  it("says what is loading once", () => {
    list();
    const status = screen.getAllByRole("status");
    expect(status).toHaveLength(1);
    expect(status[0]).toHaveTextContent("Loading Invoices");
  });

  it("leaves no gap under the bar, and keeps the table's own 2px line under the names", () => {
    const sheet = flat("src/patterns/ListPage/ListPage.module.css");
    // Regression: the loading state padded itself away from the bar.
    expect(sheet).not.toContain(".loading { padding-block");
    expect(sheet).toContain(".list:has(> .body table) { gap: 0; }");
    expect(flat("src/ui/Table/Table.module.css")).toContain("border-bottom: var(--border-width-medium) solid var(--border-brand-faint)");
  });

  it("has nothing for axe to report", async () => {
    list();
    expect(await axeViolations()).toEqual([]);
  });

  describe("loadingShape rows", () => {
    it("keeps the fixed grid instead of the rows", () => {
      list({ loadingShape: "rows", loadingRows: 12, loadingColumns: 5 });
      expect(document.querySelector("table")).toBeNull();
      expect(document.querySelectorAll('[class*="loadingRow"]')).toHaveLength(12);
      // Five columns of bars plus the Actions bar; nothing over the tick column.
      expect(bars(document.querySelector('[class*="loadingRow"]')!)).toHaveLength(6);
      expect(bars(document.querySelector('[class*="loadingHead"]')!)).toHaveLength(5);
    });

    it("gives the column-name row a tick column and the table's own line", () => {
      const sheet = flat("src/patterns/ListPage/ListPage.module.css");
      expect(sheet).toContain("grid-template-columns: var(--control-large) repeat(var(--boot-columns), minmax(0, 1fr)) var(--skeleton-list-actions)");
      expect(sheet).toContain("border-bottom: var(--border-width-medium) solid var(--border-brand-faint)");
    });

    it("draws its column names at 64 by 8", () => {
      list({ loadingShape: "rows" });
      const name = bars(document.querySelector('[class*="loadingHead"]')!)[0];
      expect(name).toHaveAttribute("style", expect.stringContaining("width: var(--skeleton-column-name)"));
    });
  });
});

describe("a booting Dashboard follows its own groups", () => {
  const dash = (props: Partial<Parameters<typeof Dashboard>[0]> = {}) =>
    render(
      <Dashboard
        label="Accounting Dashboard" name="Accounting" state="loading"
        toolbar={<Toolbar label="Dashboard tools" loading onRefresh={() => {}} actions={<Button size="sm" emphasis="strong" intent="brand">New dashboard</Button>} />}
        {...props}
      >
        <Section title="All">
          <Scoreboard items={KPIS} label="Dashboard numbers" />
          <BarChart label="AR aging" title="AR Aging By Time" categories={["Current", "1-30"]} series={[{ name: "Balance", values: [230, 60] }]} height={96} />
        </Section>
        <Section title="Month-End Close"><Table columns={COLUMNS} rows={ROWS} /></Section>
        <Section title="Invoices" />
      </Dashboard>,
    );

  it("draws one section per real group, each with its own header", () => {
    dash();
    for (const title of ["All", "Month-End Close", "Invoices"]) {
      const section = screen.getByRole("region", { name: title, hidden: true });
      expect(bars(section.querySelector("h2")!)).toHaveLength(1);
    }
    expect(document.querySelectorAll("section[aria-labelledby]")).toHaveLength(3);
  });

  it("draws a timeline's own thread and a loose Button's own block", () => {
    // Regression: a Timeline in a group, and a Button standing in a section body, stayed fully real while
    // everything around them was bars.
    render(
      <Dashboard label="Accounting Dashboard" state="loading">
        <Section title="Month-End Close">
          <Timeline
            label="Close tasks"
            items={[
              { id: "a", timestamp: "Apr 12", title: "Review and approve invoices", subtitle: "Jordan Ellis" },
              { id: "b", timestamp: "Apr 14", title: "Post recurring charges", subtitle: "Priya Raman" },
            ]}
          />
          <Button size="sm">View GL Entries Report</Button>
        </Section>
      </Dashboard>,
    );
    const entries = document.querySelectorAll("ol li");
    expect(entries).toHaveLength(2);
    // A round node block and the three lines of the entry.
    expect(bars(entries[0])).toHaveLength(4);
    expect(screen.queryByText("Review and approve invoices")).toBeNull();
    // The loose Button is a block its own size, not a control.
    expect(screen.queryByRole("button", { name: "View GL Entries Report", hidden: true })).toBeNull();
    expect(reachable()).toHaveLength(0);
  });

  it("draws the groups' own cards, charts and tables, not a message list beside a bar chart", () => {
    dash();
    expect(byClass("card", screen.getByRole("group", { name: "Dashboard numbers", hidden: true }))).toHaveLength(KPIS.length);
    // The chart keeps its own frame: a title bar and the bars standing in its box.
    const plot = document.querySelector('[class*="bootPlot"]')!;
    expect(plot).not.toBeNull();
    expect(bars(plot)).toHaveLength(6);
    expect(document.querySelector("table")).not.toBeNull();
    // Nothing of Home's own shape is drawn in this shape.
    expect(document.querySelector('[class*="messageRow"]')).toBeNull();
    expect(document.querySelector('[class*="searchBand"]')).toBeNull();
  });

  it("keeps nothing reachable by the keyboard while it is bars", () => {
    dash();
    expect(reachable()).toHaveLength(0);
    expect(document.querySelector("[inert]")).toHaveAttribute("aria-hidden", "true");
  });

  it("says what is loading once, and keeps the dashboard's name for screen readers", () => {
    dash();
    const status = screen.getAllByRole("status");
    expect(status).toHaveLength(1);
    expect(status[0]).toHaveTextContent("Loading Accounting Dashboard");
    expect(screen.getByRole("heading", { level: 2, name: "Accounting" })).toBeInTheDocument();
  });

  it("has nothing for axe to report", async () => {
    dash();
    expect(await axeViolations()).toEqual([]);
  });

  describe("loadingShape rows", () => {
    it("keeps Home's own shape instead of the groups", () => {
      dash({ loadingShape: "rows", loadingRows: 5 });
      expect(document.querySelector("section[aria-labelledby]")).toBeNull();
      expect(document.querySelectorAll('[class*="messageRow"]')).toHaveLength(5);
      expect(document.querySelector('[class*="searchBand"]')).not.toBeNull();
      expect(document.querySelectorAll('[class*="chartBars"] [aria-busy="true"]')).toHaveLength(6);
    });

    it("draws two bordered cards a grid gutter apart, and the search band's three controls", () => {
      const sheet = flat("src/patterns/Dashboard/Dashboard.module.css");
      expect(sheet).toContain("gap: var(--layout-gutter-md)");
      expect(sheet).toContain("border: var(--border-width-thin) solid var(--border-neutral-subtle)");
      expect(sheet).toContain("height: var(--skeleton-message-row)");
      expect(sheet).toContain("height: var(--skeleton-home-band)");
      dash({ loadingShape: "rows" });
      const band = document.querySelector('[class*="searchBand"]')!;
      for (const width of ["--skeleton-home-scope", "--skeleton-home-search", "--skeleton-home-search-button"]) {
        expect([...bars(band)].some((b) => b.getAttribute("style")?.includes(width))).toBe(true);
      }
    });
  });
});

describe("a booting Toolbar draws one block per control it was given", () => {
  const bar = (props: Partial<Parameters<typeof Toolbar>[0]> = {}) =>
    render(
      <Toolbar
        label="Invoice tools" loading filters={<Button size="sm">Status</Button>} onSearchChange={() => {}}
        views={[{ id: "table", label: "Table View" }]} onRefresh={() => {}}
        moreActions={[{ id: "import", label: "Import" }]}
        actions={
          <>
            <Button size="sm">Download</Button>
            <Button size="sm" emphasis="minimal">Clear</Button>
            <Button size="sm" iconOnly iconStart="print">Print</Button>
            <Button size="sm" emphasis="strong" intent="brand">New invoice</Button>
          </>
        }
        {...props}
      />,
    );

  // Every block the booting bar drew, in both halves of it.
  const bar2 = () => [...document.querySelectorAll('[class~="start"] > [aria-busy="true"], [class~="end"] > [aria-busy="true"]')];

  it("keeps every button on the right, fragments counted through", () => {
    bar();
    // Regression: a fragment of four actions drew one block.
    const end = byClass("end")[0];
    // More plus the four actions.
    expect(bars(end)).toHaveLength(5);
  });

  it("draws every control as a plain block, with only the strong one a step darker", () => {
    bar();
    const end = byClass("end")[0];
    const tones = [...end.children].map((el) => (el.className.includes("tone-band") ? "strong" : "plain"));
    // More, Download, Clear and Print are plain; only the one strong brand button is the darker block.
    expect(tones).toEqual(["plain", "plain", "plain", "plain", "strong"]);
  });

  it("keeps the line between finding and viewing, and reaches nothing by keyboard", () => {
    bar();
    expect(byClass("divider")).toHaveLength(1);
    expect(reachable()).toHaveLength(0);
    expect(document.querySelector('[role="group"]')).toHaveAttribute("aria-busy", "true");
  });

  it("draws no box and no bar inside one: a skeleton must not read as a real, empty control", () => {
    // A deliberate change from BP COBALT, which draws the outline buttons as white bordered boxes.
    const sheet = flat("src/ui/Toolbar/Toolbar.module.css");
    expect(sheet).not.toContain("--bg-neutral-min");
    expect(sheet).not.toContain("boot-outline");
    bar();
    for (const block of bar2()) {
      // One bone and nothing else: no box around it and no second block inside it.
      expect(block.querySelectorAll('[aria-busy="true"]')).toHaveLength(0);
      expect(block.children).toHaveLength(1);
    }
  });

  it("keeps every control at its own width and the control's own height", () => {
    bar();
    const start = byClass("start")[0];
    const widths = [...start.children]
      .filter((el) => el.getAttribute("aria-busy") === "true")
      .map((el) => el.getAttribute("style"));
    expect(widths[0]).toContain("var(--toolbar-filters-skeleton)");
    expect(widths[1]).toContain("var(--toolbar-search)");
    expect(widths[2]).toContain("var(--toolbar-views-skeleton)");
    // The refresh button is icon-only, so its block is the control's own square.
    expect(widths[3]).toContain("var(--control-small)");
    for (const block of bar2()) {
      expect(block.querySelector("[aria-hidden]")).toHaveAttribute("style", expect.stringContaining("height: var(--control-small)"));
    }
  });
});


// Height reservation: a booting piece has to stand exactly as tall as the piece it is waiting for, or every
// block under it sits high while the page loads and jumps down when the content arrives. The bars are 8 or 10
// tall, so each cell keeps the line box its own words will take. These assert the rules in the stylesheet,
// since jsdom lays nothing out.
const booting = (node: React.ReactNode) => render(<FormLayoutContext.Provider value={{ loading: true }}>{node}</FormLayoutContext.Provider>);

describe("a booting row keeps the height it will have", () => {
  it("gives a FormDisplay row its label's and its value's own line boxes, not the bar's", () => {
    const sheet = flat("src/ui/FormDisplay/FormDisplay.module.css");
    expect(sheet).toContain("min-height: calc(var(--font-size-regular) * var(--line-height-normal))");
    expect(sheet).toContain("min-height: calc(var(--text-ref-label-form-size) * var(--text-ref-label-form-lh))");
    // The page's border-box default would fold the cell's padding into that line box.
    expect(sheet).toContain("box-sizing: content-box");
  });

  it("keeps a start-label row's own cells and reserves the help button's square", () => {
    booting(<FormDisplay label="Account name" value="Apex Digital Services" labelPosition="start" help="The name on the contract." />);
    const row = document.querySelector("[data-label]")!;
    expect(row.getAttribute("data-label")).toBe("start");
    const dt = row.querySelector("dt")!;
    // The label's bar and the square the help button will take.
    expect(bars(dt)).toHaveLength(1);
    expect(dt.querySelectorAll('[class~="bootHelp"]')).toHaveLength(1);
    // The help popover itself is not drawn, so nothing is pressable.
    expect(reachable()).toHaveLength(0);
  });

  it("drops the help square on a row that has no help", () => {
    booting(<FormDisplay label="Account number" value="ACC-10428" labelPosition="start" />);
    expect(document.querySelectorAll('[class~="bootHelp"]')).toHaveLength(0);
  });

  it("gives a chart with a legend that legend's own room, and one key per real key", () => {
    booting(
      <BarChart
        label="AR aging" title="AR Aging By Time" height={200}
        categories={["Current", "1-30"]}
        series={[{ name: "Current", values: [230, 60] }, { name: "Overdue", values: [12, 40] }]}
      />,
    );
    const keys = document.querySelector("figure ul")!;
    expect(keys).not.toBeNull();
    expect(keys.children).toHaveLength(2);
    // Each key is the Legend's own swatch and a bar on the Legend's own line box.
    expect(bars(keys.children[0])).toHaveLength(2);
    expect(flat("src/ui/Chart/chart.module.css")).toContain("min-height: calc(var(--text-caption-size) * var(--text-caption-lh))");
  });

  it("draws no legend room for a chart that has none", () => {
    booting(
      <BarChart
        label="AR aging" title="AR Aging By Time" height={200} showLegend={false}
        categories={["Current", "1-30"]} series={[{ name: "Current", values: [230, 60] }]}
      />,
    );
    expect(document.querySelector("figure ul")).toBeNull();
  });

  it("keeps the plot's own height, borders and all", () => {
    // Regression: a content-box frame put the booting chart two pixels over the real one.
    expect(flat("src/ui/Chart/chart.module.css")).toContain("box-sizing: border-box");
  });

  it("gives a scoreboard card its own lines, and keeps the trend's arrow, figure and unit", () => {
    booting(
      <Scoreboard
        label="Record numbers"
        items={[{ id: "bal", title: "Current balance", metric: "$12,600.50", trend: { value: "4.8 %", unit: "MoM", direction: "up" } }]}
      />,
    );
    const row = document.querySelector('[class~="metricRow"]')!;
    // The number, the arrow's square, the figure and the unit: four blocks, so the row wraps where the real
    // one wraps instead of sitting on one short line.
    expect(bars(row)).toHaveLength(4);
    expect(flat("src/ui/Scoreboard/Scoreboard.module.css")).toContain("min-height: calc(1em * var(--line-height-tight))");
  });

  it("gives a page header's trail and title row their own line boxes and the badge its pill", () => {
    booting(<PageHeader title="Apex Digital Services" badge="Active" breadcrumbs={[{ label: "Home", href: "#" }, { label: "Accounts", href: "#" }]} loading />);
    const sheet = flat("src/ui/PageHeader/PageHeader.module.css");
    expect(sheet).toContain("min-height: calc(var(--text-body-size) * var(--text-body-lh))");
    expect(sheet).toContain("min-height: calc(var(--text-ref-page-size) * var(--text-ref-page-lh))");
    // The trail, the title and the badge's own pill.
    expect(bars(document.querySelector('[class~="title"]')!)).toHaveLength(3);
  });

  it("gives a timeline entry its own lines", () => {
    booting(
      <Timeline label="Close tasks" items={[{ id: "a", timestamp: "Apr 12", title: "Review and approve invoices", subtitle: "Jordan Ellis" }]} />,
    );
    expect(document.querySelectorAll('[class~="bootLine"]')).toHaveLength(3);
  });
});
