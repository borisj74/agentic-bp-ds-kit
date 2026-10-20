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
  { id: "INV-10502", account: "Northwind Holdings", status: "open", due: "2026-07-01", amount: 53422.4, paid: 0 },
  { id: "INV-10503", account: "Globex Corporation", status: "open", due: "2026-10-08", amount: 32359, paid: 0 },
  { id: "INV-10504", account: "Initech Group", status: "open", due: "2026-07-15", amount: 7797, paid: 0 },
  { id: "INV-10505", account: "Umbrella Health", status: "open", due: "2026-10-22", amount: 8225, paid: 0 },
  { id: "INV-10506", account: "Stark Logistics", status: "open", due: "2026-07-01", amount: 19752.8, paid: 0 },
  { id: "INV-10507", account: "Apex Digital Services", status: "open", due: "2026-10-08", amount: 54381, paid: 0 },
  { id: "INV-10508", account: "Wayne Freight", status: "open", due: "2026-07-15", amount: 57942, paid: 0 },
  { id: "INV-10509", account: "Hooli Cloud", status: "overdue", due: "2026-10-22", amount: 22338, paid: 0 },
  { id: "INV-10510", account: "Soylent Foods", status: "overdue", due: "2026-07-01", amount: 27857.8, paid: 0 },
  { id: "INV-10511", account: "Vandelay Industries", status: "overdue", due: "2026-10-08", amount: 28778, paid: 0 },
  { id: "INV-10512", account: "Massive Dynamic", status: "overdue", due: "2026-07-15", amount: 57360, paid: 0 },
  { id: "INV-10513", account: "Cyberdyne Systems", status: "overdue", due: "2026-10-22", amount: 28122, paid: 0 },
  { id: "INV-10514", account: "Oscorp Energy", status: "paid", due: "2026-07-01", amount: 20011.5, paid: 20011.5 },
  { id: "INV-10515", account: "Tyrell Robotics", status: "paid", due: "2026-10-08", amount: 31591, paid: 31591 },
  { id: "INV-10516", account: "Pied Piper", status: "paid", due: "2026-07-15", amount: 1034, paid: 1034 },
  { id: "INV-10517", account: "Gringotts Finance", status: "paid", due: "2026-10-22", amount: 32295, paid: 32295 },
  { id: "INV-10518", account: "Acme Inc.", status: "paid", due: "2026-07-01", amount: 8628, paid: 8628 },
  { id: "INV-10519", account: "Dunder Mifflin Paper", status: "partial", due: "2026-10-08", amount: 51146, paid: 38359.5 },
  { id: "INV-10520", account: "Blue Sun Mining", status: "partial", due: "2026-07-15", amount: 10352, paid: 7764 },
  { id: "INV-10521", account: "Monarch Media", status: "partial", due: "2026-10-22", amount: 15220, paid: 7610 },
  { id: "INV-10522", account: "Aperture Labs", status: "void", due: "2026-07-01", amount: 61698.4, paid: 0 },
  { id: "INV-10523", account: "Black Mesa Research", status: "open", due: "2026-10-08", amount: 54233, paid: 0 },
  { id: "INV-10524", account: "Nakatomi Trading", status: "open", due: "2026-07-15", amount: 852, paid: 0 },
  { id: "INV-10525", account: "Wonka Industries", status: "open", due: "2026-10-22", amount: 60927, paid: 0 },
  { id: "INV-10526", account: "Sterling Cooper", status: "open", due: "2026-07-01", amount: 53443.5, paid: 0 },
  { id: "INV-10527", account: "Prestige Worldwide", status: "open", due: "2026-10-08", amount: 57462, paid: 0 },
  { id: "INV-10528", account: "Duff Brewing", status: "open", due: "2026-07-15", amount: 35507, paid: 0 },
  { id: "INV-10529", account: "Gekko Capital", status: "open", due: "2026-10-22", amount: 45872, paid: 0 },
  { id: "INV-10530", account: "Bluth Development", status: "overdue", due: "2026-07-01", amount: 44626.8, paid: 0 },
  { id: "INV-10531", account: "Paper Street Soap", status: "overdue", due: "2026-10-08", amount: 21246, paid: 0 },
  { id: "INV-10532", account: "Northwind Holdings", status: "overdue", due: "2026-07-15", amount: 2099, paid: 0 },
  { id: "INV-10533", account: "Globex Corporation", status: "overdue", due: "2026-10-22", amount: 43064, paid: 0 },
  { id: "INV-10534", account: "Initech Group", status: "overdue", due: "2026-07-01", amount: 59229.9, paid: 0 },
  { id: "INV-10535", account: "Umbrella Health", status: "paid", due: "2026-10-08", amount: 7300, paid: 7300 },
  { id: "INV-10536", account: "Stark Logistics", status: "paid", due: "2026-07-15", amount: 43221, paid: 43221 },
  { id: "INV-10537", account: "Apex Digital Services", status: "paid", due: "2026-10-22", amount: 31074, paid: 31074 },
  { id: "INV-10538", account: "Wayne Freight", status: "paid", due: "2026-07-01", amount: 25058.5, paid: 25058.5 },
  { id: "INV-10539", account: "Hooli Cloud", status: "paid", due: "2026-10-08", amount: 43494, paid: 43494 },
  { id: "INV-10540", account: "Soylent Foods", status: "partial", due: "2026-07-15", amount: 37457, paid: 28092.8 },
  { id: "INV-10541", account: "Vandelay Industries", status: "partial", due: "2026-10-22", amount: 29127, paid: 21845.2 },
  { id: "INV-10542", account: "Massive Dynamic", status: "partial", due: "2026-07-01", amount: 38982.9, paid: 15593.2 },
  { id: "INV-10543", account: "Cyberdyne Systems", status: "void", due: "2026-10-08", amount: 12217, paid: 0 },
  { id: "INV-10544", account: "Oscorp Energy", status: "open", due: "2026-07-15", amount: 57160, paid: 0 },
  { id: "INV-10545", account: "Tyrell Robotics", status: "open", due: "2026-10-22", amount: 27690, paid: 0 },
  { id: "INV-10546", account: "Pied Piper", status: "open", due: "2026-07-01", amount: 31352.5, paid: 0 },
  { id: "INV-10547", account: "Gringotts Finance", status: "open", due: "2026-10-08", amount: 29724, paid: 0 },
  { id: "INV-10548", account: "Acme Inc.", status: "open", due: "2026-07-15", amount: 12409, paid: 0 },
  { id: "INV-10549", account: "Dunder Mifflin Paper", status: "open", due: "2026-10-22", amount: 19589, paid: 0 },
  { id: "INV-10550", account: "Blue Sun Mining", status: "open", due: "2026-07-01", amount: 2087.57, paid: 0 },
  { id: "INV-10551", account: "Monarch Media", status: "overdue", due: "2026-10-08", amount: 40701, paid: 0 },
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
  { key: "actions", header: "", alignment: "end", width: "136px" },
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
  const [pageSize, setPageSize] = useState(25);
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
        pageHeader={
          // Scrolled, the name goes and the bar is one compact line of trail: the frame says when, and takes
          // the shadow off it, since the pinned list below carries the edge.
          <PageHeader title="Invoices" breadcrumbs={[{ label: "Home", href: "#" }, { label: "Billing", href: "#" }]} />
        }
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
          <Table columns={COLUMNS} rows={rows} rowLabel="id" />
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
