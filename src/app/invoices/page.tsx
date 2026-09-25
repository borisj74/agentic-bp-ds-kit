"use client";
import { useMemo, useState } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { ListPage } from "@/patterns/ListPage/ListPage";
import { AlertDialog } from "@/ui/AlertDialog/AlertDialog";
import { AppHeader, type AppHeaderDensity } from "@/ui/AppHeader/AppHeader";
import { Button } from "@/ui/Button/Button";
import { Cell } from "@/ui/Cell/Cell";
import { Dropdown } from "@/ui/Dropdown/Dropdown";
import { EmptyState } from "@/ui/EmptyState/EmptyState";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Pagination } from "@/ui/Pagination/Pagination";
import { Scoreboard } from "@/ui/Scoreboard/Scoreboard";
import { Section } from "@/ui/Section/Section";
import { AppNav } from "@/ui/AppNav/AppNav";
import { Table, type TableColumn, type TableRow } from "@/ui/Table/Table";
import { Toast, type ToastProps } from "@/ui/Toast/Toast";
import { Toolbar } from "@/ui/Toolbar/Toolbar";

// Prototype screen: Billing › Invoices. Sample data only; nothing is saved.

type Status = "open" | "overdue" | "partial" | "paid" | "void";
interface Invoice { id: string; account: string; status: Status; due: string; amount: number; paid: number }

// The prototype's "today", so due-date filters and overdue counts stay stable.
const TODAY = Date.UTC(2026, 8, 19);
const DAY = 86_400_000;

const INVOICES: Invoice[] = [
  { id: "INV-10482", account: "Northwind Holdings", status: "overdue", due: "2026-08-28", amount: 18400, paid: 0 },
  { id: "INV-10483", account: "Globex Corporation", status: "open", due: "2026-09-24", amount: 7250, paid: 0 },
  { id: "INV-10484", account: "Initech Group", status: "paid", due: "2026-09-05", amount: 2980, paid: 2980 },
  { id: "INV-10485", account: "Umbrella Health", status: "partial", due: "2026-09-30", amount: 44120, paid: 20000 },
  { id: "INV-10486", account: "Stark Logistics", status: "overdue", due: "2026-09-02", amount: 12675.5, paid: 0 },
  { id: "INV-10487", account: "Apex Digital Services", status: "open", due: "2026-10-12", amount: 9800, paid: 0 },
  { id: "INV-10488", account: "Wayne Freight", status: "paid", due: "2026-09-10", amount: 3420, paid: 3420 },
  { id: "INV-10489", account: "Hooli Cloud", status: "overdue", due: "2026-09-12", amount: 26300, paid: 0 },
  { id: "INV-10490", account: "Soylent Foods", status: "open", due: "2026-09-22", amount: 1540.25, paid: 0 },
  { id: "INV-10491", account: "Vandelay Industries", status: "void", due: "2026-09-15", amount: 5600, paid: 0 },
  { id: "INV-10492", account: "Massive Dynamic", status: "partial", due: "2026-09-14", amount: 31200, paid: 12000 },
  { id: "INV-10493", account: "Cyberdyne Systems", status: "open", due: "2026-10-03", amount: 15890, paid: 0 },
  { id: "INV-10494", account: "Oscorp Energy", status: "paid", due: "2026-08-30", amount: 8750, paid: 8750 },
  { id: "INV-10495", account: "Tyrell Robotics", status: "overdue", due: "2026-07-31", amount: 4210, paid: 0 },
  { id: "INV-10496", account: "Pied Piper", status: "open", due: "2026-09-26", amount: 2299, paid: 0 },
  { id: "INV-10497", account: "Gringotts Finance", status: "open", due: "2026-11-01", amount: 58000, paid: 0 },
  { id: "INV-10498", account: "Acme Inc.", status: "paid", due: "2026-09-16", amount: 6120, paid: 6120 },
  { id: "INV-10499", account: "Dunder Mifflin Paper", status: "overdue", due: "2026-09-08", amount: 3985.75, paid: 0 },
  { id: "INV-10500", account: "Blue Sun Mining", status: "open", due: "2026-10-20", amount: 21440, paid: 0 },
  { id: "INV-10501", account: "Monarch Media", status: "partial", due: "2026-10-05", amount: 13600, paid: 6800 },
];

const STATUS_LABEL: Record<Status, string> = { open: "Open", overdue: "Overdue", partial: "Partially paid", paid: "Paid", void: "Void" };
const STATUS_TONE = { open: "info", overdue: "danger", partial: "warning", paid: "success", void: "neutral" } as const;
const UNPAID: Status[] = ["open", "overdue", "partial"];

const STATUS_FILTER = [
  { id: "unpaid", label: "Unpaid" },
  { id: "overdue", label: "Overdue" },
  { id: "open", label: "Open" },
  { id: "partial", label: "Partially paid" },
  { id: "paid", label: "Paid" },
  { id: "void", label: "Void" },
];
const DUE_FILTER = [
  { id: "past", label: "Past due" },
  { id: "7", label: "Next 7 days" },
  { id: "30", label: "Next 30 days" },
  { id: "later", label: "More than 30 days" },
];

const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const dueTime = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const dueLabel = (iso: string) =>
  new Date(dueTime(iso)).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
const daysUntil = (iso: string) => Math.round((dueTime(iso) - TODAY) / DAY);

function matchesStatus(inv: Invoice, f?: string) {
  if (!f) return true;
  return f === "unpaid" ? UNPAID.includes(inv.status) : inv.status === f;
}
function matchesDue(inv: Invoice, f?: string) {
  if (!f) return true;
  const d = daysUntil(inv.due);
  if (f === "past") return d < 0;
  if (f === "7") return d >= 0 && d <= 7;
  if (f === "30") return d >= 0 && d <= 30;
  return d > 30;
}

const COLUMNS: TableColumn[] = [
  { key: "id", header: "Invoice", emphasis: true },
  { key: "account", header: "Account" },
  { key: "status", header: "Status" },
  { key: "due", header: "Due date" },
  { key: "balance", header: "Balance due", numeric: true },
  { key: "amount", header: "Amount", numeric: true },
  { key: "actions", header: "", align: "end", width: "136px" },
];

type Note = Omit<ToastProps, "open" | "onClose"> & { key: number };

export default function InvoicesPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [section, setSection] = useState("billing-invoices");
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");

  const [invoices, setInvoices] = useState(INVOICES);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<{ status?: string; due?: string }>({});
  const [off, setOff] = useState<{ status?: boolean; due?: boolean }>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [picked, setPicked] = useState<string[]>([]);
  const [voiding, setVoiding] = useState<string[] | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  const notify = (n: Omit<Note, "key">) => setNotes((old) => [...old, { ...n, key: Date.now() + Math.random() }]);
  const byId = (id: string) => invoices.find((i) => i.id === id)!;

  // What is on: a filter with a value, not switched off on its chip.
  const statusOn = off.status ? undefined : filters.status;
  const dueOn = off.due ? undefined : filters.due;
  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () => invoices.filter((i) =>
      matchesStatus(i, statusOn) && matchesDue(i, dueOn) &&
      (!q || i.id.toLowerCase().includes(q) || i.account.toLowerCase().includes(q))),
    [invoices, statusOn, dueOn, q],
  );
  const lastPage = Math.max(1, Math.ceil(shown.length / pageSize));
  const current = Math.min(page, lastPage);
  const start = (current - 1) * pageSize;

  // Any change to what is shown goes back to page one.
  const setFilter = (key: "status" | "due", id: string) => {
    setFilters((f) => ({ ...f, [key]: f[key] === id ? undefined : id }));
    setOff((o) => ({ ...o, [key]: false }));
    setPage(1);
  };
  const clearAll = () => { setFilters({}); setOff({}); setQuery(""); setPage(1); };

  const remind = (ids: string[]) => {
    const due = ids.map(byId).filter((i) => UNPAID.includes(i.status));
    if (due.length === 0) return notify({ intent: "warning", title: "No reminders sent", description: "Only unpaid invoices get reminders." });
    notify({
      intent: "success",
      title: due.length === 1 ? "Reminder sent" : `${due.length} reminders sent`,
      description: due.length === 1 ? `${due[0].id} to the billing contact at ${due[0].account}.` : "Each account's billing contact was emailed.",
    });
  };
  const download = (ids: string[]) => notify({
    intent: "info",
    title: ids.length === 1 ? `Downloading ${ids[0]}.pdf` : `Downloading ${ids.length} PDFs`,
    description: ids.length === 1 ? undefined : "They arrive as one zip file.",
  });
  const confirmVoid = () => {
    const ids = (voiding ?? []).filter((id) => byId(id).status !== "void");
    const before = invoices;
    setInvoices((all) => all.map((i) => (ids.includes(i.id) ? { ...i, status: "void" as const } : i)));
    setPicked([]);
    setVoiding(null);
    notify({
      intent: "success",
      title: ids.length === 1 ? `${ids[0]} voided` : `${ids.length} invoices voided`,
      actionLabel: "Undo", onAction: () => setInvoices(before), duration: 8000,
    });
  };

  const rows: TableRow[] = shown.slice(start, start + pageSize).map((inv) => {
    const unpaid = UNPAID.includes(inv.status);
    return {
      id: inv.id,
      account: inv.account,
      status: <Cell type="badge" intent={STATUS_TONE[inv.status]} label={STATUS_LABEL[inv.status]} />,
      due: dueLabel(inv.due),
      balance: inv.status === "void" ? "—" : money(inv.amount - inv.paid),
      amount: money(inv.amount),
      actions: (
        <Cell
          type="actionIcons" alignment="end"
          actions={[
            ...(unpaid ? [{ label: "Send reminder", icon: "send", onClick: () => remind([inv.id]) }] : []),
            { label: "Download PDF", icon: "download", onClick: () => download([inv.id]) },
          ]}
          menu={inv.status === "void" ? undefined : [{ label: "Void invoice", icon: "block", emphasis: "strong", intent: "danger", onClick: () => setVoiding([inv.id]) }]}
        />
      ),
    };
  });

  const outstanding = invoices.filter((i) => UNPAID.includes(i.status));
  const overdue = outstanding.filter((i) => daysUntil(i.due) < 0);
  const dueSoon = outstanding.filter((i) => { const d = daysUntil(i.due); return d >= 0 && d <= 7; });
  const sum = (list: Invoice[]) => money(list.reduce((t, i) => t + i.amount - i.paid, 0)).replace(/\.\d\d$/, "");

  const filterCount = [statusOn, dueOn].filter(Boolean).length;
  const voidList = voiding ?? [];

  return (
    <div data-theme={dark ? "dark" : undefined} style={{ height: "100dvh" }}>
      <AppShell
        header={
          <AppHeader
            navOpen={navOpen} onNavToggle={() => setNavOpen((o) => !o)}
            environment="UAT-2" searchShortcut="Ctrl+K"
            user={{ name: "Ana Petrovic" }} company={{ name: "Northwind Holdings" }}
            darkMode={dark} onDarkModeChange={setDark}
            density={density} onDensityChange={setDensity}
            onUserSettings={() => {}} onLogout={() => {}}
          />
        }
        nav={<AppNav items={APP_NAV} endItems={APP_NAV_END} current={section} onNavigate={setSection} expanded={navOpen} />}
        navOpen={navOpen} onNavClose={() => setNavOpen(false)}
        pageHeader={<PageHeader title="Invoices" breadcrumbs={[{ label: "Home", href: "#" }, { label: "Billing", href: "#" }]} />}
      >
        <Section title="Summary" description="Where unpaid invoices stand today." collapsible>
          <Scoreboard
            label="Invoice totals"
            items={[
              { id: "outstanding", title: "Outstanding", metric: sum(outstanding), metadata: `${outstanding.length} unpaid invoices` },
              { id: "overdue", title: "Overdue", metric: sum(overdue), badge: `${overdue.length} invoices`, trend: { value: "8.4", unit: "% vs last month", status: "danger", direction: "up" } },
              { id: "soon", title: "Due in 7 days", metric: sum(dueSoon), metadata: `${dueSoon.length} invoices` },
              { id: "dso", title: "Days sales outstanding", metric: "41", metadata: "Target 38", trend: { value: "3", unit: "days", status: "danger", direction: "up" } },
            ]}
          />
        </Section>
        <ListPage
          label="Invoices"
          state={shown.length === 0 ? "empty" : "ready"}
          toolbar={
            <Toolbar
              label="Invoices"
              searchValue={query} onSearchChange={(v) => { setQuery(v); setPage(1); }} searchPlaceholder="Search invoice or account"
              filters={
                <>
                  <Dropdown
                    trigger="filter" size="sm" label="Status"
                    text={STATUS_FILTER.find((o) => o.id === filters.status)?.label}
                    toggle={filters.status ? (off.status ? "off" : "on") : undefined}
                    onToggle={filters.status ? () => { setOff((o) => ({ ...o, status: !o.status })); setPage(1); } : undefined}
                    items={STATUS_FILTER.map((o) => ({ ...o, selected: o.id === filters.status }))}
                    onSelect={(id) => setFilter("status", id)}
                  />
                  <Dropdown
                    trigger="filter" size="sm" label="Due date"
                    text={DUE_FILTER.find((o) => o.id === filters.due)?.label}
                    toggle={filters.due ? (off.due ? "off" : "on") : undefined}
                    onToggle={filters.due ? () => { setOff((o) => ({ ...o, due: !o.due })); setPage(1); } : undefined}
                    items={DUE_FILTER.map((o) => ({ ...o, selected: o.id === filters.due }))}
                    onSelect={(id) => setFilter("due", id)}
                  />
                </>
              }
              filterCount={filterCount}
              onReset={() => { setFilters({}); setOff({}); setPage(1); }}
              onRefresh={() => notify({ intent: "info", title: "Invoices are up to date" })}
              moreActions={[{ id: "export", label: "Export CSV", icon: "download" }]}
              onMoreSelect={() => notify({ intent: "info", title: `Exporting ${shown.length} invoices`, description: "The CSV follows the current filters." })}
            />
          }
          bulk={
            picked.length > 0 ? (
              <>
                <strong style={{ fontSize: "var(--font-size-small)" }}>{`${picked.length} selected`}</strong>
                <Button size="sm" iconStart="send" onClick={() => remind(picked)}>Send reminders</Button>
                <Button size="sm" iconStart="download" onClick={() => download(picked)}>Download PDFs</Button>
                <Button size="sm" emphasis="strong" intent="danger" iconStart="block" onClick={() => setVoiding(picked)}>Void</Button>
                <span style={{ marginInlineStart: "auto" }}>
                  <Button size="sm" emphasis="minimal" onClick={() => setPicked([])}>Clear</Button>
                </span>
              </>
            ) : undefined
          }
          pagination={
            <Pagination
              label="Invoice pages" total={shown.length} page={current} onPageChange={setPage}
              pageSize={pageSize} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
            />
          }
          empty={
            <EmptyState
              headingLevel={2} icon="search_off" title="No invoices match"
              description="Try another status or due date, or search for a different invoice number or account."
              actions={<Button size="sm" iconStart="filter_alt_off" onClick={clearAll}>Clear filters and search</Button>}
            />
          }
        >
          <Table columns={COLUMNS} rows={rows} selectable selected={picked} onSelectionChange={setPicked} rowLabel="id" />
        </ListPage>
      </AppShell>

      <AlertDialog
        open={voiding !== null}
        title={voidList.length === 1 ? `Void ${voidList[0]}?` : `Void ${voidList.length} invoices?`}
        description={
          voidList.length === 1
            ? `${byId(voidList[0]).account} will no longer owe ${money(byId(voidList[0]).amount - byId(voidList[0]).paid)} on this invoice. Voided invoices stay on record and cannot be sent again.`
            : "These accounts will no longer owe these invoices. Voided invoices stay on record and cannot be sent again."
        }
        actionLabel={voidList.length === 1 ? "Void invoice" : "Void invoices"} actionIntent="danger"
        onCancel={() => setVoiding(null)} onAction={confirmVoid}
      />
      {notes.map(({ key, ...n }) => (
        <Toast key={key} {...n} open onClose={() => setNotes((all) => all.filter((x) => x.key !== key))} />
      ))}
    </div>
  );
}
