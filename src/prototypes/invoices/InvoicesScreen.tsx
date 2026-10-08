"use client";

import { useCallback, useMemo, useState } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { ListPage } from "@/patterns/ListPage/ListPage";
import { AppHeader, type AppHeaderDensity } from "@/ui/AppHeader/AppHeader";
import { Button } from "@/ui/Button/Button";
import { Cell } from "@/ui/Cell/Cell";
import { DropdownMenu } from "@/ui/DropdownMenu/DropdownMenu";
import { Empty } from "@/ui/Empty/Empty";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Pagination } from "@/ui/Pagination/Pagination";
import { SideNav } from "@/ui/SideNav/SideNav";
import { Table, type TableColumn, type TableRow } from "@/ui/Table/Table";
import { Toast } from "@/ui/Toast/Toast";
import { Toolbar } from "@/ui/Toolbar/Toolbar";
import {
  INVOICES,
  type InvoiceRecord,
  type InvoiceStatus,
  formatAmount,
  formatDueDate,
  statusTone,
} from "./mockData";

const PAGE_ID = "billing-invoices";

const SHELL_SEARCH = [
  {
    heading: "Recent",
    items: [
      { id: "r1", label: "INV-10422 — Northwind Holdings", icon: "receipt_long" },
      { id: "r2", label: "INV-10431 — Globex Corporation", icon: "receipt_long" },
      { id: "r3", label: "Q3 billing run", icon: "bar_chart" },
      { id: "r4", label: "Northwind Holdings", icon: "group" },
    ],
  },
];

const SHELL_SEARCH_SCOPES = [
  { value: "invoices", label: "Invoices" },
  { value: "accounts", label: "Accounts" },
  { value: "products", label: "Products" },
];

const SHELL_HEADER_ACTIONS = [
  { id: "help", label: "Help", icon: "help" },
  { id: "news", label: "What's new", icon: "campaign" },
  { id: "feedback", label: "Feedback", icon: "chat_info" },
];

const STATUS_OPTIONS: { id: InvoiceStatus; label: string }[] = [
  { id: "Paid", label: "Paid" },
  { id: "Unpaid", label: "Unpaid" },
  { id: "Overdue", label: "Overdue" },
  { id: "Draft", label: "Draft" },
  { id: "Partially paid", label: "Partially paid" },
  { id: "Void", label: "Void" },
];

type DueFilter = "overdue" | "week" | "month" | "later";

const DUE_OPTIONS: { id: DueFilter; label: string }[] = [
  { id: "overdue", label: "Overdue" },
  { id: "week", label: "Due in 7 days" },
  { id: "month", label: "Due this month" },
  { id: "later", label: "Due later" },
];

const COLUMNS: TableColumn[] = [
  { key: "number", header: "Invoice", emphasis: true },
  { key: "account", header: "Account" },
  { key: "status", header: "Status" },
  { key: "due", header: "Due date" },
  { key: "amount", header: "Amount", numeric: true },
  { key: "actions", header: "", align: "end", width: "112px" },
];

const today = new Date("2026-09-15T12:00:00");

function dueMatchesFilter(dueDate: string, filter: DueFilter | undefined): boolean {
  if (!filter) return true;
  const due = new Date(`${dueDate}T00:00:00`);
  const startOfToday = new Date(today);
  startOfToday.setHours(0, 0, 0, 0);
  const inSevenDays = new Date(startOfToday);
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  switch (filter) {
    case "overdue":
      return due < startOfToday;
    case "week":
      return due >= startOfToday && due <= inSevenDays;
    case "month":
      return due >= startOfToday && due <= endOfMonth;
    case "later":
      return due > endOfMonth;
    default:
      return true;
  }
}

type ToastState = { open: boolean; title: string; description?: string; tone?: "info" | "success" | "warning" | "danger" };

export function InvoicesScreen() {
  const [navOpen, setNavOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [density, setDensity] = useState<AppHeaderDensity>("default");
  const [compact, setCompact] = useState(false);
  const [invoices, setInvoices] = useState(INVOICES);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | undefined>();
  const [statusOff, setStatusOff] = useState(false);
  const [dueFilter, setDueFilter] = useState<DueFilter | undefined>();
  const [dueOff, setDueOff] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toast, setToast] = useState<ToastState>({ open: false, title: "" });

  const showToast = useCallback((next: Omit<ToastState, "open">) => {
    setToast({ ...next, open: true });
  }, []);

  const voidInvoice = useCallback((id: string) => {
    setInvoices((rows) => rows.map((row) => (row.id === id ? { ...row, status: "Void" as InvoiceStatus } : row)));
    showToast({ title: "Invoice voided", description: `${id} is marked void.`, tone: "warning" });
  }, [showToast]);

  const sendReminder = useCallback((id: string, account: string) => {
    showToast({
      title: "Reminder sent",
      description: `Payment reminder emailed for ${id} to ${account}.`,
      tone: "success",
    });
  }, [showToast]);

  const downloadPdf = useCallback((id: string) => {
    showToast({
      title: "Download started",
      description: `${id}.pdf is downloading.`,
      tone: "info",
    });
  }, [showToast]);

  const activeFilterCount = (statusFilter && !statusOff ? 1 : 0) + (dueFilter && !dueOff ? 1 : 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesQuery =
        q.length === 0 ||
        invoice.id.toLowerCase().includes(q) ||
        invoice.account.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || statusOff || invoice.status === statusFilter;
      const matchesDue = dueMatchesFilter(invoice.dueDate, dueOff ? undefined : dueFilter);
      return matchesQuery && matchesStatus && matchesDue;
    });
  }, [invoices, query, statusFilter, statusOff, dueFilter, dueOff]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const currentPage = Math.min(page, maxPage);
  const start = (currentPage - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const rows: TableRow[] = pageRows.map((invoice: InvoiceRecord) => ({
    id: invoice.id,
    number: invoice.id,
    account: invoice.account,
    status: <Cell type="badge" tone={statusTone(invoice.status)} label={invoice.status} />,
    due: formatDueDate(invoice.dueDate),
    amount: formatAmount(invoice.amount),
    actions: (
      <Cell
        type="actionIcons"
        align="end"
        actions={[
          {
            label: "Send reminder",
            icon: "send",
            onClick: () => sendReminder(invoice.id, invoice.account),
          },
          {
            label: "Download PDF",
            icon: "download",
            onClick: () => downloadPdf(invoice.id),
          },
        ]}
        menu={[
          {
            label: "Void",
            icon: "block",
            variant: "danger",
            onClick: () => voidInvoice(invoice.id),
          },
        ]}
      />
    ),
  }));

  const resetFilters = () => {
    setStatusFilter(undefined);
    setDueFilter(undefined);
    setStatusOff(false);
    setDueOff(false);
    setPage(1);
  };

  const filterChips = (
    <>
      <DropdownMenu
        trigger="filter"
        size="sm"
        label="Status"
        text={STATUS_OPTIONS.find((o) => o.id === statusFilter)?.label}
        toggle={statusFilter ? (statusOff ? "off" : "on") : undefined}
        onToggle={statusFilter ? () => setStatusOff((off) => !off) : undefined}
        items={STATUS_OPTIONS.map((o) => ({ ...o, selected: o.id === statusFilter }))}
        onSelect={(id) => {
          const next = id as InvoiceStatus;
          setStatusFilter((current) => (current === next ? undefined : next));
          setStatusOff(false);
          setPage(1);
        }}
      />
      <DropdownMenu
        trigger="filter"
        size="sm"
        label="Due date"
        text={DUE_OPTIONS.find((o) => o.id === dueFilter)?.label}
        toggle={dueFilter ? (dueOff ? "off" : "on") : undefined}
        onToggle={dueFilter ? () => setDueOff((off) => !off) : undefined}
        items={DUE_OPTIONS.map((o) => ({ ...o, selected: o.id === dueFilter }))}
        onSelect={(id) => {
          const next = id as DueFilter;
          setDueFilter((current) => (current === next ? undefined : next));
          setDueOff(false);
          setPage(1);
        }}
      />
    </>
  );

  const listState = filtered.length === 0 ? "empty" : "ready";

  return (
    <div data-theme={dark ? "dark" : undefined} style={{ minHeight: "100vh" }}>
      <AppShell
        header={
          <AppHeader
            navOpen={navOpen}
            onNavToggle={() => setNavOpen((open) => !open)}
            environment="UAT-2"
            searchShortcut="Ctrl+K"
            searchGroups={SHELL_SEARCH}
            searchScopes={SHELL_SEARCH_SCOPES}
            actions={SHELL_HEADER_ACTIONS}
            onAction={() => {}}
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
          <SideNav
            items={APP_NAV}
            endItems={APP_NAV_END}
            current={PAGE_ID}
            onNavigate={() => {}}
            expanded={navOpen}
          />
        }
        navOpen={navOpen}
        onNavClose={() => setNavOpen(false)}
        onPageHeaderStick={setCompact}
        pageHeader={
          <PageHeader
            title="Invoices"
            sticky={compact}
            breadcrumbs={[
              { label: "Home", href: "/prototypes/invoices" },
              { label: "Billing", href: "/prototypes/invoices" },
            ]}
          />
        }
      >
        <ListPage
          label="Invoices"
          state={listState}
          toolbar={
            <Toolbar
              label="Invoices"
              filters={filterChips}
              filterCount={activeFilterCount}
              onReset={resetFilters}
              onApply={() => {}}
              filterHelp="Narrow by status or due date. Toggle a chip off to keep it without applying."
              searchValue={query}
              onSearchChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              searchPlaceholder="Search invoices"
              onRefresh={() => {
                setInvoices(INVOICES);
                showToast({ title: "List refreshed", description: "Invoice data reloaded from mock source.", tone: "info" });
              }}
              moreActions={[
                { id: "export", label: "Export all", icon: "download" },
                { id: "import", label: "Import", icon: "upload" },
              ]}
              onMoreSelect={() => {}}
              actions={
                <Button size="sm" variant="primary" iconStart="add">
                  New invoice
                </Button>
              }
            />
          }
          pagination={
            <Pagination
              total={filtered.length}
              page={currentPage}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={(next) => {
                setPageSize(next);
                setPage(1);
              }}
              label="Invoices"
            />
          }
          empty={
            <Empty
              headingLevel={2}
              icon="manage_search"
              iconStyle="plain"
              title="No invoices match your filters"
              description="Try clearing filters or searching by invoice number or account name."
              actions={
                <Button size="sm" variant="secondary" onClick={resetFilters}>
                  Clear filters
                </Button>
              }
            />
          }
        >
          <Table
            caption="Open and overdue invoices for billing operations."
            columns={COLUMNS}
            rows={rows}
          />
        </ListPage>
      </AppShell>

      <Toast
        open={toast.open}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        title={toast.title}
        description={toast.description}
        tone={toast.tone}
      />
    </div>
  );
}
