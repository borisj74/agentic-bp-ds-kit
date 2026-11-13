"use client";
// Starter screen: a list of records. Sample data only; nothing is saved.
// Change the records, the columns and the filters to whatever your screen lists.
import { useMemo, useState } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { ListPage } from "@/patterns/ListPage/ListPage";
import { AppHeader, type AppHeaderDensity } from "@/ui/AppHeader/AppHeader";
import { AppNav } from "@/ui/AppNav/AppNav";
import { Button } from "@/ui/Button/Button";
import { Cell } from "@/ui/Cell/Cell";
import { Dropdown } from "@/ui/Dropdown/Dropdown";
import { EmptyState } from "@/ui/EmptyState/EmptyState";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Pagination } from "@/ui/Pagination/Pagination";
import { Section } from "@/ui/Section/Section";
import { Scoreboard } from "@/ui/Scoreboard/Scoreboard";
import { Table, type TableColumn, type TableRow } from "@/ui/Table/Table";
import { Toolbar } from "@/ui/Toolbar/Toolbar";

type Status = "open" | "overdue" | "paid";

interface Invoice {
  id: string;
  account: string;
  status: Status;
  due: string;
  amount: string;
}

const INVOICES: Invoice[] = [
  { id: "INV-10482", account: "Northwind Holdings", status: "overdue", due: "Aug 28, 2026", amount: "$18,400.00" },
  { id: "INV-10483", account: "Globex Corporation", status: "open", due: "Sep 24, 2026", amount: "$7,250.00" },
  { id: "INV-10484", account: "Initech Group", status: "paid", due: "Sep 5, 2026", amount: "$2,980.00" },
  { id: "INV-10485", account: "Umbrella Health", status: "open", due: "Sep 30, 2026", amount: "$44,120.00" },
  { id: "INV-10486", account: "Stark Logistics", status: "overdue", due: "Sep 2, 2026", amount: "$12,675.50" },
  { id: "INV-10487", account: "Apex Digital Services", status: "open", due: "Oct 12, 2026", amount: "$9,800.00" },
  { id: "INV-10488", account: "Wayne Freight", status: "paid", due: "Sep 10, 2026", amount: "$3,420.00" },
  { id: "INV-10489", account: "Hooli Cloud", status: "overdue", due: "Sep 12, 2026", amount: "$26,300.00" },
  { id: "INV-10490", account: "Soylent Foods", status: "open", due: "Sep 22, 2026", amount: "$1,540.25" },
  { id: "INV-10491", account: "Blue Sun Mining", status: "open", due: "Oct 20, 2026", amount: "$21,440.00" },
];

const STATUS_LABEL: Record<Status, string> = { open: "Open", overdue: "Overdue", paid: "Paid" };
const STATUS_INTENT = { open: "info", overdue: "danger", paid: "success" } as const;

const STATUS_FILTER = [
  { id: "open", label: "Open" },
  { id: "overdue", label: "Overdue" },
  { id: "paid", label: "Paid" },
];

const COLUMNS: TableColumn[] = [
  { key: "id", header: "Invoice", emphasis: true },
  { key: "account", header: "Account" },
  { key: "status", header: "Status" },
  { key: "due", header: "Due date" },
  { key: "amount", header: "Amount", numeric: true },
];

const SUMMARY = [
  { id: "outstanding", title: "Outstanding", metric: "$141,525", metadata: "7 unpaid invoices" },
  { id: "overdue", title: "Overdue", metric: "$57,375", badge: "3 invoices" },
  { id: "paid", title: "Paid this month", metric: "$6,400", metadata: "2 invoices" },
];

export default function InvoicesListStarter() {
  const [navOpen, setNavOpen] = useState(true);
  const [section, setSection] = useState("billing-invoices");
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      INVOICES.filter(
        (i) =>
          (!status || i.status === status) &&
          (!q || i.id.toLowerCase().includes(q) || i.account.toLowerCase().includes(q)),
      ),
    [status, q],
  );

  const lastPage = Math.max(1, Math.ceil(shown.length / pageSize));
  const current = Math.min(page, lastPage);
  const start = (current - 1) * pageSize;

  const clearAll = () => {
    setStatus("");
    setQuery("");
    setPage(1);
  };

  const rows: TableRow[] = shown.slice(start, start + pageSize).map((inv) => ({
    id: inv.id,
    account: inv.account,
    status: <Cell type="badge" intent={STATUS_INTENT[inv.status]} label={STATUS_LABEL[inv.status]} />,
    due: inv.due,
    amount: inv.amount,
  }));

  return (
    <div data-theme={dark ? "dark" : undefined} style={{ height: "100dvh" }}>
      <AppShell
        header={
          <AppHeader
            navOpen={navOpen}
            onNavToggle={() => setNavOpen((o) => !o)}
            environment="UAT-2"
            searchShortcut="Ctrl+K"
            user={{ name: "Ana Petrovic" }}
            company={{ name: "Northwind Holdings" }}
            darkMode={dark}
            onDarkModeChange={setDark}
            density={density}
            onDensityChange={setDensity}
            onUserSettings={() => {}}
            onLogout={() => {}}
          />
        }
        nav={
          <AppNav
            items={APP_NAV}
            endItems={APP_NAV_END}
            current={section}
            onNavigate={setSection}
            expanded={navOpen}
          />
        }
        navOpen={navOpen}
        onNavClose={() => setNavOpen(false)}
        pageHeader={<PageHeader title="Invoices" breadcrumbs={[{ label: "Home", href: "#" }, { label: "Billing", href: "#" }]} />}
      >
        <Section title="Summary" collapsible>
          <Scoreboard label="Invoice totals" items={SUMMARY} />
        </Section>
        <ListPage
          label="Invoices"
          state={shown.length === 0 ? "empty" : "ready"}
          toolbar={
            <Toolbar
              label="Invoices"
              searchValue={query}
              onSearchChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              searchPlaceholder="Search invoice or account"
              filterCount={status ? 1 : 0}
              filters={
                <Dropdown
                  trigger="filter"
                  size="sm"
                  label="Status"
                  text={STATUS_FILTER.find((o) => o.id === status)?.label}
                  toggle={status ? "on" : undefined}
                  onToggle={status ? () => setStatus("") : undefined}
                  items={STATUS_FILTER.map((o) => ({ ...o, selected: o.id === status }))}
                  onSelect={(id) => {
                    setStatus((was) => (was === id ? "" : id));
                    setPage(1);
                  }}
                />
              }
              onReset={clearAll}
              onRefresh={() => {}}
              actions={
                <Button size="sm" emphasis="strong" intent="brand" iconStart="add">
                  New invoice
                </Button>
              }
            />
          }
          pagination={
            <Pagination
              label="Invoice pages"
              total={shown.length}
              page={current}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={(n) => {
                setPageSize(n);
                setPage(1);
              }}
            />
          }
          empty={
            <EmptyState
              headingLevel={2}
              icon="search_off"
              title="No invoices match"
              description="Try another status, or search for a different invoice number or account."
              actions={
                <Button size="sm" iconStart="filter_alt_off" onClick={clearAll}>
                  Clear filters and search
                </Button>
              }
            />
          }
        >
          <Table columns={COLUMNS} rows={rows} rowLabel="id" />
        </ListPage>
      </AppShell>
    </div>
  );
}
