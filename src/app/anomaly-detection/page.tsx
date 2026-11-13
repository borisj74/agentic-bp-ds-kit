"use client";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { ChatWindow } from "@/patterns/ChatWindow/ChatWindow";
import { ListPage } from "@/patterns/ListPage/ListPage";
import { RecordPage } from "@/patterns/RecordPage/RecordPage";
import { Accordion } from "@/ui/Accordion/Accordion";
import { AlertDialog } from "@/ui/AlertDialog/AlertDialog";
import { AppHeader } from "@/ui/AppHeader/AppHeader";
import { AppNav } from "@/ui/AppNav/AppNav";
import { Badge } from "@/ui/Badge/Badge";
import { Button } from "@/ui/Button/Button";
import { Cascader } from "@/ui/Cascader/Cascader";
import { Callout } from "@/ui/Callout/Callout";
import { Cell } from "@/ui/Cell/Cell";
import { ChatComposer } from "@/ui/ChatComposer/ChatComposer";
import { ChatMessage, type ChatMessageActionId } from "@/ui/ChatMessage/ChatMessage";
import { Checkbox } from "@/ui/Checkbox/Checkbox";
import { Drawer } from "@/ui/Drawer/Drawer";
import { DataGrid } from "@/ui/DataGrid/DataGrid";
import { Dropdown } from "@/ui/Dropdown/Dropdown";
import { EmptyState } from "@/ui/EmptyState/EmptyState";
import { FilterButton } from "@/ui/FilterButton/FilterButton";
import { Form } from "@/ui/Form/Form";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { Input } from "@/ui/Input/Input";
import { Meter } from "@/ui/Meter/Meter";
import { Modal } from "@/ui/Modal/Modal";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Scoreboard } from "@/ui/Scoreboard/Scoreboard";
import { Section } from "@/ui/Section/Section";
import { Select } from "@/ui/Select/Select";
import { Steps } from "@/ui/Steps/Steps";
import { Table, type TableRow } from "@/ui/Table/Table";
import { Tabs } from "@/ui/Tabs/Tabs";
import { Textarea } from "@/ui/Textarea/Textarea";
import { Timeline } from "@/ui/Timeline/Timeline";
import { Toast, type ToastProps } from "@/ui/Toast/Toast";
import { Toolbar } from "@/ui/Toolbar/Toolbar";
import {
  AGG_OPTIONS, ANOMALY_FILTER, ANOMALY_INTENT, BAD_REOPENED, COMPARE_OPTIONS, DATE_OPTIONS, FIELD_PATHS, FIELD_TREE, FIELD_VALUES,
  FLAG_COUNTS, INVOICES, INVOICES_FOUND, INVOICES_TOTAL, LOOKBACK_OPTIONS, NUMBER_WORDS, OP_OPTIONS, PERIOD_START, REQUIRED_CONDITIONS, RESULT_INTENT,
  SAMPLE_INVOICES, SEED_CONFIGS, STATUS_FILTERS, STATUS_INTENT, STEPS, SUGGESTED, TODAY, UNCONFIRMED, VALUE_TREE,
  compareLabel, dateLabel, feedbackScope, isBadCondition, newSetup, readySummary, resultLabel, statusLabel, valuesLabel, whichInvoices, whyFlagged, withoutUsed,
  type Config, type Invoice, type Result, type Setup,
} from "./data";
import styles from "./page.module.css";

// Prototype: Settings › AI Settings › Anomaly detection, and Billing › Invoices with its flags.
// Sample data from the review canvas, local state only. Nothing is saved, and a reload starts over.

type View = "list" | "invoices" | "compare" | "check" | "training" | "stopped" | "results" | "applying" | "ready" | "saved" | "billing" | "invoice";
type Note = Omit<ToastProps, "open" | "onClose"> & { key: number };
interface ChatTurn { id: string; author: "assistant" | "user"; text: string; openInvoice?: string }

const WIZARD: View[] = ["invoices", "compare", "check"];
const AI_SETTINGS = "settings-ai-settings";
const INVOICES_PAGE = "billing-invoices";
const NOT_CONFIRMED = "Not confirmed yet";
const LIST_CRUMBS = (toList: () => void) => [{ label: "Home", href: "#" }, { label: "Settings", href: "#" }, { label: "Anomaly detection", onClick: toList }];

let lastId = 0;
const freshId = (prefix: string) => `${prefix}-${++lastId}`;
const anomalyPhrase = (i: Invoice) => `a ${(i.anomaly ?? "").toLowerCase()}`;
const unconfirmed = (id: string) => UNCONFIRMED.find((u) => u.id === id)!;

export default function AnomalyDetectionPrototype() {
  const [view, setView] = useState<View>("list");
  const [navOpen, setNavOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const notify = (n: Omit<Note, "key">) => setNotes((old) => [...old, { ...n, key: ++lastId }]);

  // Admin side.
  const [configs, setConfigs] = useState<Config[]>(SEED_CONFIGS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [setup, setSetup] = useState<Setup>(newSetup());
  const [nameError, setNameError] = useState<string>();
  const [query, setQuery] = useState("");
  const [statusChips, setStatusChips] = useState<string[]>([]);
  const [stopping, setStopping] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [savedTab, setSavedTab] = useState("overview");
  const [savedName, setSavedName] = useState("");
  // Cancel throws work away, unlike Continue later. Editing a configuration that is past setup keeps a copy to go back to.
  const [editingFrom, setEditingFrom] = useState<Config | null>(null);
  const [discarding, setDiscarding] = useState(false);
  // The field picker dialog: what it adds, and the path picked so far.
  const [picker, setPicker] = useState<{ kind: "condition" | "value"; at: number; path: string[]; names: string[] } | null>(null);
  const [fixes, setFixes] = useState({ f1: true, f2: true, f3: false });
  // The Good/Poor switch swaps to the canvas's Poor sample; this is what to go back to.
  const [beforePoor, setBeforePoor] = useState<{ activeId: string; sample: Config } | null>(null);

  const active = configs.find((c) => c.id === activeId) ?? null;
  const patch = (id: string, change: Partial<Config>) => setConfigs((all) => all.map((c) => (c.id === id ? { ...c, ...change } : c)));

  // Only the AppShell page scrolls, and it stays mounted between screens: each new screen starts at its top.
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => { frame.current?.querySelector("main")?.scrollTo(0, 0); }, [view, activeId]);

  // Runs tick along for as long as they are live, on any screen, so leaving the page does not stop them.
  // The Stop dialog holds the clock, so a run cannot finish behind it.
  useEffect(() => {
    if (stopping || !configs.some((c) => c.live)) return;
    const timer = setTimeout(() => {
      const finished = configs.filter((c) => c.live && c.progress >= 100);
      setConfigs((all) => all.map((c) => {
        if (!c.live) return c;
        if (c.progress >= 100) {
          return c.status === "training"
            ? { ...c, live: false, progress: 0, status: "results" as const, result: { kind: "good" as const, score: 7.8 }, trained: TODAY }
            : { ...c, live: false, progress: 100, status: "ready" as const };
        }
        return { ...c, progress: Math.min(100, c.progress + (c.status === "training" ? 4 : 5)) };
      }));
      for (const c of finished) {
        const next: View = c.status === "training" ? "results" : "ready";
        if (c.id === activeId && (view === "training" || view === "applying")) { setView(next); continue; }
        notify({
          intent: "success",
          title: c.status === "training" ? `${c.setup.name}: results are ready` : `${c.setup.name}: ready to turn on`,
          actionLabel: "Open", onAction: () => { setActiveId(c.id); setView(next); },
        });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [configs, stopping, activeId, view]);

  // Writing the wizard's work back to the list. A new configuration first appears here.
  const persist = (s: Setup, change: Partial<Config> = {}): string => {
    const id = activeId ?? freshId("new");
    setConfigs((all) => {
      const had = all.find((c) => c.id === id);
      if (had) {
        const status = change.status ?? (had.status === "stopped" ? "stopped" : "draft");
        return all.map((c) => (c.id === id ? { ...c, setup: s, status, result: status === "draft" ? null : c.result, ...change } : c));
      }
      return [{ id, setup: s, status: "draft", progress: 0, live: false, result: null, trained: "—", ...change }, ...all];
    });
    setActiveId(id);
    return id;
  };

  const addPicked = () => {
    const id = picker?.path[picker.path.length - 1];
    if (!picker || !id) return;
    const { kind, at, names } = picker;
    const into = <T,>(list: T[], item: T) => [...list.slice(0, at), item, ...list.slice(at)];
    setSetup((s) => (kind === "condition"
      ? { ...s, conditions: into(s.conditions, { id: freshId("c"), field: id, op: "is", value: FIELD_VALUES[id][0].label }) }
      : { ...s, values: into(s.values, { id, field: names[names.length - 1], from: names.length > 1 ? names[0] : "Invoice", agg: "sum" }) }));
    setPicker(null);
  };

  const goList = () => { setView("list"); setNameError(undefined); };
  const leaveWizard = () => {
    const touched = activeId !== null || setup.name.trim() !== "" || setup.description.trim() !== "";
    if (touched) {
      persist({ ...setup, name: setup.name.trim() || "Untitled configuration" });
      notify({ intent: "success", title: "Saved in Drafts", description: "Pick it up from the list when you're ready." });
    }
    goList();
  };
  const newConfiguration = () => { setActiveId(null); setEditingFrom(null); setSetup(newSetup()); setNameError(undefined); setView("invoices"); };
  const edit = (c: Config) => { setActiveId(c.id); setEditingFrom(c.status === "draft" ? null : c); setSetup(c.setup); setNameError(undefined); setView("invoices"); };
  const same = (a: Setup, b: Setup) => JSON.stringify(a) === JSON.stringify(b);
  const putBack = () => { if (editingFrom) setConfigs((all) => all.map((c) => (c.id === editingFrom.id ? editingFrom : c))); };
  // Nothing to lose means nothing to ask: a new configuration still blank, or an edit with no changes.
  const cancelWizard = () => {
    if (editingFrom ? same(setup, editingFrom.setup) : activeId === null && same(setup, newSetup())) { putBack(); goList(); return; }
    setDiscarding(true);
  };
  const discard = () => {
    setDiscarding(false);
    if (editingFrom) {
      putBack();
      notify({ intent: "info", title: "Changes discarded", description: `${editingFrom.setup.name} is back to how it was.` });
    } else {
      setConfigs((all) => all.filter((c) => c.id !== activeId));
      notify({ intent: "info", title: "Draft discarded" });
    }
    setActiveId(null);
    goList();
  };

  // A row opens where that configuration stands. Only work still in setup goes back to the steps.
  const openConfig = (c: Config) => {
    if (c.status === "draft") return edit(c);
    setActiveId(c.id);
    const where: Record<Config["status"], View> = {
      draft: "invoices", training: "training", stopped: "stopped", results: "results", needsChanges: "results",
      applying: "applying", ready: "ready", active: "saved", paused: "saved",
    };
    if (c.status === "applying") patch(c.id, { live: true });
    if (c.status === "active" || c.status === "paused") { setSavedTab("overview"); setSavedName(c.setup.name); }
    setView(where[c.status]);
  };
  const startTraining = (id: string, change: Partial<Config> = {}) => {
    patch(id, { status: "training", progress: 0, live: true, ...change });
    setActiveId(id);
    setView("training");
  };
  const toNext = () => {
    if (!setup.name.trim()) { setNameError("Give this check a name."); return; }
    persist(setup);
    setView("compare");
  };
  const stopTraining = () => {
    if (active) patch(active.id, { status: "stopped", progress: 0, live: false });
    setStopping(false);
    setView("stopped");
  };
  const applyToAll = () => {
    if (!active) return;
    patch(active.id, { status: "applying", progress: 0, live: true });
    setBeforePoor(null);
    setView("applying");
  };
  const turnOn = () => {
    if (!active) return;
    patch(active.id, { status: "active", progress: 0, live: false });
    notify({ intent: "success", title: "Detection is on", description: "Only new closed invoices are checked from now on." });
    goList();
  };
  const duplicate = (c: Config) => {
    setConfigs((all) => [{ ...c, id: freshId("copy"), setup: { ...c.setup, name: `${c.setup.name} copy` }, status: "draft", progress: 0, live: false, result: null, trained: "—" }, ...all]);
    notify({ intent: "success", title: "Copy saved in Drafts" });
  };
  const confirmDelete = () => {
    const c = configs.find((x) => x.id === deleting);
    setConfigs((all) => all.filter((x) => x.id !== deleting));
    setDeleting(null);
    if (c) notify({ intent: "success", title: `${c.setup.name} deleted` });
    setBeforePoor(null);
    goList();
  };
  const showResult = (kind: string) => {
    if (!active) return;
    const poor: Result = { kind: "poor", score: 3.1 };
    if (kind === "poor") {
      if (active.id === "s1") { patch("s1", { result: poor, status: "needsChanges", trained: TODAY }); return; }
      const sample = configs.find((c) => c.id === "s1");
      if (!sample) return;
      setBeforePoor({ activeId: active.id, sample });
      patch("s1", { result: poor, status: "needsChanges", trained: TODAY });
      setActiveId("s1");
    } else if (beforePoor) {
      const { activeId: back, sample } = beforePoor;
      setConfigs((all) => all.map((c) => (c.id === "s1" ? sample : c)));
      setActiveId(back);
      setBeforePoor(null);
    } else {
      patch(active.id, { result: { kind: "good", score: 7.8 }, status: "results" });
    }
  };
  const retrainWithFixes = () => {
    if (!active) return;
    const s = active.setup;
    startTraining(active.id, {
      result: null,
      setup: {
        ...s,
        lookback: fixes.f2 ? "24" : s.lookback,
        values: fixes.f1 ? s.values.filter((v) => v.field !== "Standard rate" && v.field !== "Tax amount") : s.values,
      },
    });
    setBeforePoor(null);
  };

  // Billing side.
  const [invoices, setInvoices] = useState(INVOICES);
  const [invoiceQuery, setInvoiceQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [anomalyFilter, setAnomalyFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>();
  const [paymentFilter, setPaymentFilter] = useState<string>();
  const [currencyFilter, setCurrencyFilter] = useState<string>();
  const [selected, setSelected] = useState<string[]>([]);
  const [noticeClosed, setNoticeClosed] = useState(false);
  const [detailNoticeClosed, setDetailNoticeClosed] = useState(false);
  const [openInvoiceId, setOpenInvoiceId] = useState("11");
  const [invoiceTab, setInvoiceTab] = useState("details");
  const [chatInvoiceId, setChatInvoiceId] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [vote, setVote] = useState<ChatMessageActionId[]>([]);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();

  const invoiceById = (id: string | null) => invoices.find((i) => i.id === id) ?? null;
  const openInvoice = invoiceById(openInvoiceId);
  const chatInvoice = invoiceById(chatInvoiceId);
  const feedbackInvoice = invoiceById(feedbackFor);
  const assistantOpen = chatInvoiceId !== null;

  const askWhy = (id: string) => { setChatInvoiceId(id); setTurns([]); setVote([]); };
  const toInvoice = (id: string) => { setOpenInvoiceId(id); setInvoiceTab("details"); setDetailNoticeClosed(false); setChatInvoiceId(null); setView("invoice"); };
  const showFlagged = () => { setAnomalyFilter(ANOMALY_FILTER.map((a) => a.id)); setFiltersOpen(true); };
  const resetFilters = () => { setAnomalyFilter([]); setStatusFilter(undefined); setPaymentFilter(undefined); setCurrencyFilter(undefined); };
  const openFeedback = (id: string) => { setFeedbackFor(id); setReason(""); setReasonError(undefined); };
  const sendFeedback = () => {
    if (!feedbackInvoice) return;
    if (!reason.trim()) { setReasonError("Say why this isn't an anomaly. The model learns from it."); return; }
    const done = feedbackInvoice;
    const left = invoices.find((i) => i.anomaly && i.id !== done.id && i.id === "11") ?? invoices.find((i) => i.anomaly && i.id !== done.id);
    setInvoices((all) => all.map((i) => (i.id === done.id ? { ...i, anomaly: null, pills: undefined } : i)));
    setFeedbackFor(null);
    if (chatInvoiceId === done.id) {
      setVote(["down"]);
      setTurns((t) => [...t, {
        id: `thanks-${t.length}`, author: "assistant",
        text: `Thanks. This won't be flagged for ${done.account} again; other billing profiles are still checked.${left ? ` The next flagged invoice is ${left.number}.` : ""}`,
        openInvoice: left?.id,
      }]);
    }
    notify({
      intent: "success", title: "Feedback sent", description: `Applies to ${done.account} only.`,
      ...(left ? { actionLabel: `Open ${left.number}`, onAction: () => toInvoice(left.id) } : {}),
    });
  };
  const sendChat = (text: string) => setTurns((t) => [
    ...t,
    { id: `u-${t.length}`, author: "user", text },
    { id: `a-${t.length}`, author: "assistant", text: "This prototype only answers why an invoice was flagged. In the product I'd look that up for you here." },
  ]);

  const flagCounts = useMemo(() => {
    const cleared = INVOICES.filter((i) => i.anomaly && !invoices.find((x) => x.id === i.id)?.anomaly);
    const counts = { ...FLAG_COUNTS };
    for (const i of cleared) counts[i.anomaly as string] -= 1;
    return counts;
  }, [invoices]);
  const flagTotal = Object.values(flagCounts).reduce((a, b) => a + b, 0);

  const navigate = (id: string) => {
    if (WIZARD.includes(view) && (id === AI_SETTINGS || id === INVOICES_PAGE)) leaveWizard();
    if (id === AI_SETTINGS) goList();
    else if (id === INVOICES_PAGE) setView("billing");
    else notify({ intent: "info", title: "Not part of this prototype", description: "Try Settings › AI Settings or Billing › Invoices." });
  };

  // Jumps from the guide, each on its own sample.
  const demoSetup = newSetup("Recurring charge check");
  const jump = (to: "list" | "training" | "results" | "saved" | "billing") => {
    setGuideOpen(false);
    if (to === "list") return goList();
    if (to === "billing") { setChatInvoiceId(null); return setView("billing"); }
    if (to === "saved") return openConfig(configs.find((c) => c.status === "active") ?? configs[0]);
    const id = freshId("demo");
    setConfigs((all) => [{ id, setup: demoSetup, status: to === "training" ? "training" : "results", progress: 0, live: to === "training", result: to === "training" ? null : { kind: "good", score: 7.8 }, trained: to === "training" ? "—" : TODAY }, ...all]);
    setActiveId(id);
    setView(to);
  };
  // The states an admin can't click their way into, reached from the guide so the screens show only the product.
  const showCheck = (bad: boolean) => {
    setGuideOpen(false);
    const conditions = (list: Setup["conditions"]) => [...list.filter((c) => !isBadCondition(c)), ...(bad ? [BAD_REOPENED] : [])];
    if (view === "check") { setSetup((s) => ({ ...s, conditions: conditions(s.conditions) })); return; }
    const id = freshId("demo");
    const sample = { ...demoSetup, conditions: conditions(demoSetup.conditions) };
    setConfigs((all) => [{ id, setup: sample, status: "draft", progress: 0, live: false, result: null, trained: "—" }, ...all]);
    setActiveId(id);
    setEditingFrom(null);
    setSetup(sample);
    setView("check");
  };
  const showResultState = (kind: "good" | "poor") => {
    setGuideOpen(false);
    if (view === "results" && active) { showResult(kind); return; }
    if (kind === "good") { jump("results"); return; }
    const poorRun = { result: { kind: "poor" as const, score: 3.1 }, status: "needsChanges" as const, trained: TODAY };
    const seed = SEED_CONFIGS.find((c) => c.id === "s1")!;
    setConfigs((all) => (all.some((c) => c.id === "s1") ? all.map((c) => (c.id === "s1" ? { ...c, ...poorRun } : c)) : [{ ...seed, ...poorRun }, ...all]));
    setActiveId("s1");
    setView("results");
  };
  const resetAll = () => {
    setConfigs(SEED_CONFIGS); setInvoices(INVOICES); setActiveId(null); setSetup(newSetup()); setBeforePoor(null);
    setChatInvoiceId(null); resetFilters(); setFiltersOpen(false); setNoticeClosed(false); setGuideOpen(false); setQuery(""); setStatusChips([]); setInvoiceQuery("");
    setView("list");
  };

  const billingSide = view === "billing" || view === "invoice";
  const steps = (current: number, canGoBack = false) => (
    <Steps
      steps={STEPS} current={current} fill label="New configuration progress"
      onStepClick={canGoBack ? (n) => setView(WIZARD[n - 1]) : undefined}
    />
  );

  /* ---------- Admin screens ---------- */

  const listScreen = () => {
    const q = query.trim().toLowerCase();
    const allowed = STATUS_FILTERS.filter((f) => statusChips.includes(f.id)).flatMap((f) => f.statuses);
    const shown = configs.filter((c) => (!q || c.setup.name.toLowerCase().includes(q)) && (allowed.length === 0 || allowed.includes(c.status)));
    const rows: TableRow[] = shown.map((c) => ({
      id: c.id,
      name: <Cell type="link" label={c.setup.name} onClick={() => openConfig(c)} />,
      invoices: `Closed, original invoices · ${c.setup.lookback} months`,
      status: <Cell type="badge" label={statusLabel(c)} intent={STATUS_INTENT[c.status]} />,
      result: c.result ? <Cell type="badge" label={resultLabel(c.result)} intent={RESULT_INTENT[c.result.kind]} /> : "Not trained yet",
      trained: c.trained,
      actions: (
        <Cell
          type="actionMenu" label="Configuration actions" alignment="end"
          actions={[
            { label: "Edit", icon: "edit", onClick: () => openConfig(c) },
            { label: "Duplicate", icon: "content_copy", onClick: () => duplicate(c) },
            { label: "Delete", icon: "delete", emphasis: "strong", intent: "danger", onClick: () => setDeleting(c.id) },
          ]}
        />
      ),
    }));
    return {
      header: (
        <PageHeader
          title="Anomaly detection"
          breadcrumbs={[{ label: "Home", href: "#" }, { label: "Settings", href: "#" }]}
          actions={
            <>
              <Button size="sm" iconStart="download" onClick={() => notify({ intent: "info", title: `Exporting ${shown.length} configurations` })}>Export</Button>
              <Button size="sm" emphasis="strong" intent="brand" iconStart="add" onClick={newConfiguration}>New configuration</Button>
            </>
          }
        />
      ),
      body: (
        <>
          <Callout closeButton intent="info" title="Anomaly detection finds unusual charges on closed invoices">
            Each configuration learns what normal looks like for one kind of charge, then flags invoices that don&apos;t fit. Billing users see the flags on the Invoices list.
          </Callout>
          <ListPage
            label="Anomaly detection configurations"
            state={shown.length === 0 ? "empty" : "ready"}
            toolbar={
              <Toolbar
                label="Configurations" searchPlaceholder="Search configurations" searchValue={query} onSearchChange={setQuery}
                filterCount={statusChips.length} onReset={() => setStatusChips([])}
                filters={STATUS_FILTERS.map((f) => (
                  <FilterButton
                    key={f.id} size="sm" hasDropdown={false} toggle={statusChips.includes(f.id) ? "on" : undefined}
                    onToggle={() => setStatusChips((on) => (on.includes(f.id) ? on.filter((x) => x !== f.id) : [...on, f.id]))}
                  >
                    {f.id}
                  </FilterButton>
                ))}
                onRefresh={() => notify({ intent: "info", title: "Statuses are up to date" })}
              />
            }
            empty={<EmptyState headingLevel={2} icon="search_off" title="No configurations match" description="Try a different name or status." actions={<Button size="sm" iconStart="filter_alt_off" onClick={() => { setQuery(""); setStatusChips([]); }}>Clear filters and search</Button>} />}
          >
            <Table
              rowLabel="id"
              columns={[
                { key: "name", header: "Name", emphasis: true },
                { key: "invoices", header: "Which invoices" },
                { key: "status", header: "Status" },
                { key: "result", header: "Result" },
                { key: "trained", header: "Last trained" },
                { key: "actions", header: "", alignment: "end" },
              ]}
              rows={rows}
            />
          </ListPage>
        </>
      ),
    };
  };

  // The step's way forward sits with Continue later in the header, so it stays in reach as the bar shrinks on scroll.
  const wizardHeader = (showNew: boolean, stepActions: ReactNode) => (
    <PageHeader
      title={showNew ? "New configuration" : setup.name || "New configuration"}
      breadcrumbs={LIST_CRUMBS(leaveWizard)}
      badge={active ? statusLabel(active) : "Draft"}
      badgeIntent={active ? STATUS_INTENT[active.status] : "neutral"}
      actions={
        <>
          <Button size="sm" emphasis="minimal" onClick={cancelWizard}>Cancel</Button>
          <Button size="sm" iconStart="schedule" onClick={leaveWizard}>Continue later</Button>
          {stepActions}
        </>
      }
    />
  );

  const invoicesScreen = () => {
    const bad = setup.conditions.some(isBadCondition);
    return {
      header: wizardHeader(!active, (
        <Button size="sm" emphasis="strong" intent="brand" iconEnd="arrow_forward" onClick={toNext}>Next: what to compare</Button>
      )),
      body: (
        <>
          {steps(1)}
          {bad && (
            <Callout closeButton intent="danger" title="One condition can't be checked">
              &quot;Reopened&quot; is a yes/no field on the invoice, but the condition compares it with a date. Change the value to Yes or No, or remove the condition.
            </Callout>
          )}
          {setup.conditions.some((c) => c.field === "reopened") && (
            <Callout closeButton intent="info" title={NOT_CONFIRMED}>{unconfirmed("reopened").label}: {unconfirmed("reopened").text}</Callout>
          )}
          <Section title="Which invoices to check">
            {/* Read-only rows sit flush, and a Form holding any drops its row gap, so they get a Form of their own. */}
            <Form columns={2} labelPosition="start">
              <FormDisplay label="Record type" value="Invoice" help="More record types will follow." />
            </Form>
            <Form columns={2} labelPosition="start">
            <Input
              label="Name" required placeholder="Recurring charge check" value={setup.name} error={nameError}
              onChange={(name) => { setSetup((s) => ({ ...s, name })); setNameError(undefined); }}
            />
            <Select
              label="Date field" required options={DATE_OPTIONS} value={setup.dateField}
              onChange={(v) => setSetup((s) => ({ ...s, dateField: v as string }))}
              hint="Close date is when an invoice is final, so charges are compared on the same time line."
            />
            <Select
              label="Look back" options={LOOKBACK_OPTIONS} value={setup.lookback}
              onChange={(v) => setSetup((s) => ({ ...s, lookback: v as string }))}
              hint="12 to 24 months is best. Longer covers seasonal billing but takes longer to train."
            />
            <Textarea
              label="Description" placeholder="What should this check catch? For example, recurring charges billed at the wrong rate."
              value={setup.description} onChange={(description) => setSetup((s) => ({ ...s, description }))}
            />
            </Form>
          </Section>
          <Section title="Conditions">
            <Table
              caption="Required conditions" size="sm"
              columns={[{ key: "field", header: "Field", emphasis: true }, { key: "op", header: "Condition" }, { key: "value", header: "Value" }, { key: "why", header: "Why" }, { key: "lock", header: "" }]}
              rows={REQUIRED_CONDITIONS.map((r) => ({ ...r, lock: <Cell type="badge" label="Required" intent="neutral" size="sm" /> }))}
            />
          </Section>
          <Section
            title="Extra conditions (optional)"
          >
            <DataGrid
              label="Extra conditions" rowNumbers={false} canInsertRows insertLabel="Add condition" canAddRows={setup.conditions.length === 0} canRemoveRows emptyLabel="No extra conditions."
              columns={[
                { key: "field", header: "Field", readOnly: true },
                { key: "op", header: "Condition", type: "select", options: setup.conditions.some((c) => c.op === "isAfter") ? [...OP_OPTIONS, { value: "isAfter", label: "is after" }] : OP_OPTIONS, width: "240px" },
                { key: "value", header: "Value", placeholder: "Enter a value" },
              ]}
              rows={setup.conditions.map((c) => ({ id: c.id, field: c.field ? FIELD_PATHS[c.field] : "", op: c.op, value: c.value }))}
              onRowsChange={(rows) => {
                // A new row starts by picking its field, so it only joins the grid once the picker says which.
                const added = rows.findIndex((r) => !r.field);
                if (added >= 0) { setPicker({ kind: "condition", at: added, path: [SUGGESTED], names: [] }); return; }
                setSetup((s) => ({
                ...s,
                conditions: rows.map((r) => {
                  const was = s.conditions.find((c) => c.id === r.id)!;
                  const next = { ...was, op: r.op, value: r.value };
                  // A yes/no value can't sit behind "is after", so fixing the value fixes the comparison too.
                  return next.op === "isAfter" && !isBadCondition(next) ? { ...next, op: "is" } : next;
                }),
                }));
              }}
              cellReadOnly={(r, key) => key === "value" && (r.op === "empty" || r.op === "notEmpty")}
              cellStatus={(r, key) => (key === "value" && setup.conditions.some((c) => c.id === r.id && isBadCondition(c)) ? { intent: "danger", label: "Can't be checked", tint: true } : undefined)}
            />
          </Section>
        </>
      ),
    };
  };

  const compareScreen = () => {
    const count = setup.values.length;
    return {
      header: wizardHeader(false, (
        <>
          <Button size="sm" iconStart="arrow_back" onClick={() => setView("invoices")}>Back</Button>
          <Button size="sm" emphasis="strong" intent="brand" iconEnd="arrow_forward" onClick={() => { persist(setup); setView("check"); }}>Next: check data</Button>
        </>
      )),
      body: (
        <>
          {steps(2, true)}
          {count >= 3 && (
            <Callout closeButton intent="warning" title={`${NUMBER_WORDS[count] ?? count} values watched`}>
              Each value you add makes training slower and can lower the score. If the result comes back Fair or Poor, try removing one first.
            </Callout>
          )}
          <Section title="Compare invoices per">
            <Form columns={2} labelPosition="start">
            <Select
              label="Compare invoices per" required multiple options={COMPARE_OPTIONS} value={setup.comparePer}
              onChange={(v) => setSetup((s) => ({ ...s, comparePer: v as string[] }))}
              error={setup.comparePer.length ? undefined : "Pick at least one."}
              hint="Billing profile suits most checks: each customer is compared with their own history."
            />
            </Form>
          </Section>
          <Section
            title="Values to watch"
          >
            <DataGrid
              label="Values to watch" rowNumbers={false} canInsertRows insertLabel="Add value" canAddRows={setup.values.length === 0} canRemoveRows emptyLabel="No values yet. Add at least one."
              columns={[
                { key: "field", header: "Value", readOnly: true },
                { key: "from", header: "From", readOnly: true },
                { key: "agg", header: "Combine per invoice", type: "select", options: AGG_OPTIONS, width: "240px" },
              ]}
              rows={setup.values.map((v) => ({ id: v.id, field: v.field, from: v.from, agg: v.agg }))}
              onRowsChange={(rows) => {
                const added = rows.findIndex((r) => !r.field);
                if (added >= 0) { setPicker({ kind: "value", at: added, path: [SUGGESTED], names: [] }); return; }
                setSetup((s) => ({ ...s, values: rows.map((r) => ({ id: r.id, field: r.field, from: r.from, agg: r.agg })) }));
              }}
            />
          </Section>
        </>
      ),
    };
  };

  const checkScreen = () => {
    const badCondition = setup.conditions.some(isBadCondition);
    const noCompare = setup.comparePer.length === 0;
    const noValues = setup.values.length === 0;
    const hasError = badCondition || noCompare || noValues;
    const status = (ok: boolean) => <Cell type="status" label={ok ? "Passed" : "Can't check"} intent={ok ? "success" : "danger"} />;
    const fix = (label: string, to: View) => <Cell type="link" label={label} onClick={() => setView(to)} />;
    const checks = [
      { id: "k1", check: "Date field", status: status(true), detail: `${dateLabel(setup)} is a date field.`, fix: "" },
      { id: "k2", check: "Required conditions", status: status(true), detail: "Closed, original invoices only.", fix: "" },
      ...(badCondition ? [{ id: "k3", check: "Extra condition: Reopened", status: status(false), detail: "Yes/no field compared with a date.", fix: fix("Fix in Conditions", "invoices") }] : []),
      { id: "k4", check: "Compare per", status: status(!noCompare), detail: noCompare ? "Nothing picked." : `${compareLabel(setup)}.`, fix: noCompare ? fix("Fix in Compare", "compare") : "" },
      { id: "k5", check: "Values to watch", status: status(!noValues), detail: noValues ? "Nothing to watch." : `${setup.values.map((v) => v.field).join(", ")} ${setup.values.length === 1 ? "is a number" : "are numbers"}.`, fix: noValues ? fix("Fix in Compare", "compare") : "" },
    ];
    return {
      header: wizardHeader(false, (
        <>
          <Button size="sm" iconStart="arrow_back" onClick={() => setView("compare")}>Back</Button>
          <Button
            size="sm" emphasis="strong" intent="brand" iconStart="model_training" disabled={hasError}
            onClick={() => { persist(setup, { status: "training", progress: 0, live: true, result: null }); setView("training"); }}
          >
            Start training
          </Button>
        </>
      )),
      body: (
        <>
          {steps(3, true)}
          {hasError ? (
            <>
              {badCondition ? (
                <Callout closeButton intent="danger" title="One condition can't be checked" actionLabel="Go to Conditions" onAction={() => setView("invoices")}>
                  &quot;Reopened&quot; is a yes/no field on the invoice, but the condition compares it with a date. Pick &quot;Reopened by invoice&quot; instead, or change the value to Yes or No.
                </Callout>
              ) : (
                <Callout closeButton intent="danger" title="Something is missing" actionLabel="Go to Compare" onAction={() => setView("compare")}>
                  Pick what to compare invoices per, and at least one value to watch.
                </Callout>
              )}
              {badCondition && <Callout closeButton intent="info" title={NOT_CONFIRMED}>{unconfirmed("reopened").label}: {unconfirmed("reopened").text}</Callout>}
              <Section title="Checks before training">
                <Table caption="Checks before training" columns={[{ key: "check", header: "Check", emphasis: true }, { key: "status", header: "Result" }, { key: "detail", header: "Detail" }, { key: "fix", header: "" }]} rows={checks} />
              </Section>
              <Section title="Invoices that will be used">
                <EmptyState title="Fix the condition to see the invoices" description="We'll count the invoices and show a sample here." />
              </Section>
            </>
          ) : (
            <>
              <Callout closeButton intent="success" title="Ready to train">{readySummary(setup)}</Callout>
              <Section title="Invoices that will be used">
                <Scoreboard
                  label="Invoices that will be used"
                  items={[
                    { id: "match", title: "Invoices that match", metric: INVOICES_FOUND.toLocaleString("en-US"), metadata: `of ${INVOICES_TOTAL.toLocaleString("en-US")} invoices` },
                    { id: "profiles", title: "Billing profiles", metric: "1,206" },
                    { id: "period", title: "Look back", metric: `${setup.lookback} months`, metadata: `${PERIOD_START[setup.lookback]} to 31 Oct 2026` },
                  ]}
                />
              </Section>
              <Section title="Sample">
                <Table
                  caption="Sample invoices"
                  columns={[{ key: "invoice", header: "Invoice", emphasis: true }, { key: "profile", header: "Billing profile" }, { key: "closed", header: "Close date" }, { key: "rate", header: "Rate (avg)", numeric: true }, { key: "qty", header: "Quantity (sum)", numeric: true }, { key: "cost", header: "Cost (sum)", numeric: true }]}
                  rows={SAMPLE_INVOICES}
                />
                <Accordion
                  items={[
                    { id: "training", title: "What happens when you train", content: "The model learns from a 5% sample of these invoices. It usually takes 10 minutes to an hour and keeps running if you leave the page." },
                    { id: "query", title: "Technical details: query", content: `SELECT {!InvoiceObj.Id}, {!InvoiceObj.BillingProfileId}, AVG({!InvoiceObj.Activity__InvoiceIdObj.Rate}), SUM({!InvoiceObj.Activity__InvoiceIdObj.Quantity}), SUM({!InvoiceObj.Activity__InvoiceIdObj.Cost}), {!InvoiceObj.ClosedDate} WHERE {!InvoiceObj.Status} = 'CLOSED' AND {!InvoiceObj.CreatedByInvoiceId} IS NULL AND {!InvoiceObj.ReopenedByInvoiceId} IS NULL AND {!InvoiceObj.ClosedDate} >= ADD_MONTHS(SYSTIMESTAMP, -${setup.lookback})` },
                  ]}
                />
              </Section>
            </>
          )}
        </>
      ),
    };
  };

  // Past setup, the way forward stays where it was on the setup steps: in the header.
  const skipAhead = (c: Config) => (
    <Button size="sm" emphasis="minimal" iconStart="fast_forward" onClick={() => patch(c.id, { progress: 100 })}>Skip ahead</Button>
  );
  const runHeader = (c: Config, actions: ReactNode) => (
    <PageHeader title={c.setup.name} breadcrumbs={LIST_CRUMBS(goList)} badge={statusLabel(c)} badgeIntent={STATUS_INTENT[c.status]} actions={actions} />
  );
  const trainingScreen = (c: Config) => ({
    header: <PageHeader title={c.setup.name} breadcrumbs={LIST_CRUMBS(goList)} badge="Training" badgeIntent="info" actions={<>{skipAhead(c)}<Button size="sm" emphasis="minimal" intent="danger" iconStart="stop_circle" onClick={() => setStopping(true)}>Stop training</Button><Button size="sm" iconStart="list" onClick={goList}>Back to configurations</Button></>} />,
    body: (
      <>
        {steps(4)}
        <Callout closeButton intent="info" title="You can leave this page">Training keeps running in the background. Its status shows on the Anomaly detection list, and we&apos;ll tell you when it&apos;s done.</Callout>
        <Callout closeButton intent="info" title={NOT_CONFIRMED}>{unconfirmed("email").label}: {unconfirmed("email").text}</Callout>
        <Section
          title="Training the model"
        >
          <div className={styles.progress}>
            <div className={styles.progressHead}>
              <strong>{c.progress}% done</strong>
              <span className={styles.quiet}>Started 10:07 · simple checks usually take 10 to 15 minutes</span>
            </div>
            <Meter label="Training progress" value={c.progress} size="md" />
          </div>
          <Checkbox label="Email me when training is done" defaultChecked />
        </Section>
        <Section title="What is being trained" columns={2}>
          <FormDisplay label="Which invoices" value={whichInvoices(c.setup)} labelPosition="start" />
          <FormDisplay label="Date field" value={dateLabel(c.setup)} labelPosition="start" />
          <FormDisplay label="Compare per" value={compareLabel(c.setup)} labelPosition="start" />
          <FormDisplay label="Values to watch" value={valuesLabel(c.setup)} labelPosition="start" />
        </Section>
      </>
    ),
  });

  const stoppedScreen = (c: Config) => ({
    header: runHeader(c, (
      <>
        <Button size="sm" iconStart="list" onClick={goList}>Back to configurations</Button>
        <Button size="sm" iconStart="edit" onClick={() => edit(c)}>Edit configuration</Button>
        <Button size="sm" emphasis="strong" intent="brand" iconStart="model_training" onClick={() => startTraining(c.id)}>Start training again</Button>
      </>
    )),
    body: (
      <>
        {steps(4)}
        <Callout closeButton intent="warning" title="Training stopped at 10:22">Nothing from this run was kept. Your settings are saved, so you can change them or start training again.</Callout>
        <Section title="Stopping, step by step" collapsible defaultExpanded={false}>
          <Table
            caption="Stop training states"
            columns={[{ key: "when", header: "When", emphasis: true }, { key: "status", header: "Status shown" }, { key: "what", header: "What the admin sees" }]}
            rows={[
              { id: "1", when: "Clicks Stop training", status: <Cell type="status" label="Confirming" intent="neutral" />, what: "Dialog: Stop training? Progress so far is lost. Stop training · Keep training" },
              { id: "3", when: "Confirms", status: <Cell type="status" label="Training stopped" intent="warning" />, what: "This screen: Edit configuration and Start training again." },
              { id: "4", when: "Run can't be stopped", status: <Cell type="status" label="Couldn't stop (not confirmed)" intent="danger" />, what: "Plain message with Try again; no need to edit the ETL run record by hand." },
            ]}
          />
        </Section>
        <Section title="Settings" columns={2}>
          <FormDisplay label="Which invoices" value={whichInvoices(c.setup)} labelPosition="start" />
          <FormDisplay label="Compare per" value={compareLabel(c.setup)} labelPosition="start" />
          <FormDisplay label="Values to watch" value={c.setup.values.map((v, i) => (i ? v.field.toLowerCase() : v.field)).join(", ")} labelPosition="start" />
          <FormDisplay label="Status" value={<Badge intent="warning">Training stopped</Badge>} labelPosition="start" />
        </Section>
      </>
    ),
  });

  const resultsScreen = (c: Config) => {
    const poor = c.result?.kind === "poor";
    if (!poor) {
      const r = c.result ?? { kind: "good" as const, score: 7.8 };
      return {
        header: (
          <PageHeader
            title={c.setup.name} breadcrumbs={LIST_CRUMBS(goList)} badge="Results ready" badgeIntent="info"
            actions={
              <>
                <Button size="sm" iconStart="list" onClick={goList}>Back to configurations</Button>
                <Button size="sm" iconStart="tune" onClick={() => edit(c)}>Change settings and retrain</Button>
                <Button size="sm" emphasis="strong" intent="brand" iconStart="play_arrow" onClick={applyToAll}>Apply to all invoices</Button>
              </>
            }
          />
        ),
        body: (
          <>
            {steps(5)}
            <Callout closeButton intent="info" title={NOT_CONFIRMED}>{unconfirmed("apply").label}: {unconfirmed("apply").text}</Callout>
            <Section title="Result">
              <div className={styles.score}>
                <div className={styles.scoreText}>
                  <div className={styles.scoreHead}>
                    <Badge intent="success" emphasis="strong" size="lg">Good</Badge>
                    <span>{r.score.toFixed(1)} out of 10</span>
                  </div>
                  <p>It catches most unusual charges, with a few false flags. In a test, it found about 6 in 10 planted problems, and 6 in 10 of its flags were real.</p>
                  <p className={styles.quiet}>Next: apply it to all your invoices. So far it has only seen a 5% sample. When that finishes, you can turn on detection.</p>
                </div>
              </div>
            </Section>
            <Accordion
              items={[
                { id: "strengths", title: "Technical details: where it does well and where it doesn't", content: "Does well: ranks unusual invoices above normal ones very reliably. Misses: slow, steady price creep, and charges that are about double normal." },
                { id: "metrics", title: "Technical details: metrics", content: "Precision 0.62 · Recall 0.63 · F1 0.63 · ROC-AUC 0.97 · PR-AUC 0.68 · Flag rate 7% · Threshold: fitted contamination · Model version 1 · Evaluated 9 Sep 2026 11:39" },
                { id: "test", title: "Technical details: how it was tested", content: "Known problems were planted in a copy of the data (level shift, magnitude ×2 and others). Level shift: 13% caught. Magnitude ×2: 21% caught." },
              ]}
            />
          </>
        ),
      };
    }
    const fixRow = (id: keyof typeof fixes, change: string, why: string) => ({
      id, change, why,
      pick: <Cell type="checkbox" label={change} checked={fixes[id]} onCheckedChange={(on: boolean) => setFixes((f) => ({ ...f, [id]: on }))} />,
    });
    return {
      header: (
        <PageHeader
          title={c.setup.name} breadcrumbs={LIST_CRUMBS(goList)} badge="Needs changes" badgeIntent="warning"
          moreActions={[{ id: "delete", label: "Delete configuration", icon: "delete", danger: true }]}
          onMoreSelect={() => setDeleting(c.id)}
          actions={
            <>
              <Button size="sm" iconStart="list" onClick={goList}>Back to configurations</Button>
              <Button size="sm" iconStart="edit" onClick={() => edit(c)}>Edit settings</Button>
              <Button size="sm" emphasis="strong" intent="brand" iconStart="model_training" onClick={retrainWithFixes}>Apply changes and retrain</Button>
            </>
          }
        />
      ),
      body: (
        <>
          {steps(5)}
          <Callout closeButton intent="info" title={NOT_CONFIRMED}>{unconfirmed("ranges").label}: {unconfirmed("ranges").text}</Callout>
          <Section title="Result">
            <div className={styles.score}>
              <div className={styles.scoreText}>
                <div className={styles.scoreHead}>
                  <Badge intent="danger" emphasis="strong" size="lg">Poor</Badge>
                  <span>3.1 out of 10</span>
                </div>
                <p>It misses most unusual charges and would flag many normal invoices. Don&apos;t turn it on yet.</p>
                <p className={styles.quiet}>This is usually the settings, not the model. Too many values add noise. Try the changes below, then train again.</p>
              </div>
            </div>
          </Section>
          <Section title="Suggested changes">
            <Table
              caption="Suggested changes"
              columns={[{ key: "pick", header: "", width: "48px" }, { key: "change", header: "Change", emphasis: true }, { key: "why", header: "Why it helps" }]}
              rows={[
                fixRow("f1", "Remove Standard rate and Tax amount", "They move with Rate and Cost, so they add noise, not signal."),
                fixRow("f2", `Look back 24 months instead of ${c.setup.lookback}`, "More history covers seasonal billing."),
                fixRow("f3", "Split usage charges into their own check", "Usage and recurring charges behave differently."),
              ]}
            />
          </Section>
          <Accordion
            items={[
              { id: "metrics", title: "Technical details: metrics", content: "Precision 0.21 · Recall 0.34 · F1 0.26 · ROC-AUC 0.71 · Flag rate 18% · Model version 1" },
              { id: "test", title: "Technical details: how it was tested", content: "Known problems were planted in a copy of the data. Level shift: 9% caught. Magnitude ×2: 14% caught." },
            ]}
          />
        </>
      ),
    };
  };

  const configSummary = (c: Config) => (
    <Section title="This configuration" columns={2}>
      <FormDisplay label="Which invoices" value={whichInvoices(c.setup)} />
      <FormDisplay label="Compare per" value={compareLabel(c.setup)} />
      <FormDisplay label="Values to watch" value={valuesLabel(c.setup)} />
      <FormDisplay label="Result" value={c.result ? <Badge intent={RESULT_INTENT[c.result.kind]}>{resultLabel(c.result)}</Badge> : "Not trained yet"} />
    </Section>
  );

  const applyingScreen = (c: Config) => {
    const checked = Math.round((INVOICES_FOUND * c.progress) / 100).toLocaleString("en-US");
    return {
      header: runHeader(c, (
        <>
          {skipAhead(c)}
          <Button size="sm" iconStart="list" onClick={goList}>Back to configurations</Button>
          <Button size="sm" emphasis="strong" intent="brand" iconStart="power_settings_new" disabled>Turn on detection</Button>
        </>
      )),
      body: (
        <>
          {steps(6)}
          <Callout closeButton intent="info" title="You can leave this page">This keeps running in the background and can take a while with many invoices. Its status shows on the Anomaly detection list.</Callout>
          <Section title="Applying to all invoices">
            <div className={styles.progress}>
              <div className={styles.progressHead}>
                <strong>{checked} of {INVOICES_FOUND.toLocaleString("en-US")} invoices</strong>
                <span className={styles.quiet}>Started 11:02</span>
              </div>
              <Meter label="Invoices checked" value={c.progress} />
            </div>
          </Section>
          {configSummary(c)}
        </>
      ),
    };
  };

  const readyScreen = (c: Config) => ({
    header: runHeader(c, (
      <>
        <Button size="sm" iconStart="list" onClick={goList}>Back to configurations</Button>
        <Button size="sm" emphasis="strong" intent="brand" iconStart="power_settings_new" onClick={turnOn}>Turn on detection</Button>
      </>
    )),
    body: (
      <>
        {steps(6)}
        <Callout closeButton intent="success" title={`All ${INVOICES_FOUND.toLocaleString("en-US")} invoices checked`}>The model is ready. Turn on detection to start checking new invoices.</Callout>
        <Callout closeButton intent="info" title="What happens when you turn it on">Each invoice is checked when its status changes to Closed. Open invoices are not checked, because they can still change. Billing users see flags on the Invoices list and on the invoice itself.</Callout>
        {configSummary(c)}
      </>
    ),
  });

  const savedScreen = (c: Config) => {
    const checked = c.checked ?? `All ${INVOICES_FOUND.toLocaleString("en-US")} past invoices · new ones as they close`;
    const resultBadge = c.result ? <Badge intent={RESULT_INTENT[c.result.kind]}>{resultLabel(c.result)}</Badge> : "Not trained yet";
    const tabContent: Record<string, ReactNode> = {
      overview: (
        <>
          <Callout closeButton intent="info">Saved configurations open here, not in the setup steps. Changes to an active check mean training again; flags keep coming from the current model until you turn the new one on.</Callout>
          <Section title="Overview">
            <Form columns={2} labelPosition="start">
            <Input label="Name" required value={savedName} onChange={setSavedName} />
            <Select
              label="Status" options={[{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }]} value={c.status}
              onChange={(v) => patch(c.id, { status: v as Config["status"] })} hint="Paused stops new flags; existing flags stay."
            />
            </Form>
            <Form columns={2} labelPosition="start">
            <FormDisplay label="Which invoices" value={whichInvoices(c.setup)} />
            <FormDisplay label="Date field" value={dateLabel(c.setup)} />
            <FormDisplay label="Compare per" value={compareLabel(c.setup)} />
            <FormDisplay label="Values to watch" value={valuesLabel(c.setup)} />
            </Form>
          </Section>
          <Section title="Latest result" columns={3}>
            <FormDisplay label="Result" value={resultBadge} />
            <FormDisplay label="Last trained" value={c.trained} />
            <FormDisplay label="Invoices checked" value={checked} />
          </Section>
        </>
      ),
      invoices: (
        <Section title="Which invoices">
          <Table
            caption="Required conditions" size="sm"
            columns={[{ key: "field", header: "Field", emphasis: true }, { key: "op", header: "Condition" }, { key: "value", header: "Value" }, { key: "why", header: "Why" }]}
            rows={REQUIRED_CONDITIONS}
          />
        </Section>
      ),
      compare: (
        <Section title="What to compare" columns={2}>
          <FormDisplay label="Compare per" value={compareLabel(c.setup)} />
          <FormDisplay label="Values to watch" value={valuesLabel(c.setup)} />
        </Section>
      ),
      results: (
        <Section title="Training and results" columns={3}>
          <FormDisplay label="Result" value={resultBadge} />
          <FormDisplay label="Last trained" value={c.trained} />
          <FormDisplay label="Invoices checked" value={checked} />
        </Section>
      ),
      history: (
        <Section title="History">
          <Timeline
            label="Configuration history"
            items={[
              { id: "on", title: "Detection turned on", timestamp: "21 Oct 2026", icon: "power_settings_new", intent: "success" },
              { id: "applied", title: "Applied to all invoices", timestamp: "21 Oct 2026", icon: "play_arrow" },
              { id: "trained", title: `Trained: ${c.result ? resultLabel(c.result) : "no result"}`, timestamp: c.trained, icon: "model_training" },
            ]}
          />
        </Section>
      ),
    };
    return {
      header: (
        <PageHeader
          title={c.setup.name} breadcrumbs={LIST_CRUMBS(goList)} badge={statusLabel(c)} badgeIntent={STATUS_INTENT[c.status]}
          moreActions={[{ id: "duplicate", label: "Duplicate", icon: "content_copy" }, { id: "delete", label: "Delete", icon: "delete", danger: true }]}
          onMoreSelect={(id) => (id === "delete" ? setDeleting(c.id) : duplicate(c))}
          actions={
            <>
              <Button size="sm" onClick={goList}>Cancel</Button>
              <Button
                size="sm" emphasis="strong" intent="brand"
                onClick={() => startTraining(c.id, { setup: { ...c.setup, name: savedName.trim() || c.setup.name }, result: null })}
              >
                Save and retrain
              </Button>
            </>
          }
        />
      ),
      body: (
        <>
          <Tabs
            label="Configuration sections" size="md" value={savedTab} onChange={setSavedTab}
            items={[{ id: "overview", label: "Overview" }, { id: "invoices", label: "Which invoices" }, { id: "compare", label: "What to compare" }, { id: "results", label: "Training and results" }, { id: "history", label: "History" }]}
          />
          {tabContent[savedTab]}
        </>
      ),
    };
  };

  /* ---------- Billing user screens ---------- */

  const invoicesRow = (i: Invoice, withActions: boolean): TableRow => ({
    id: i.id,
    invoice: <Cell type="link" label={i.number} onClick={() => toInvoice(i.id)} />,
    account: i.account,
    anomaly: i.anomaly ? <Cell type="badge" label={i.anomaly} intent={ANOMALY_INTENT(i.anomaly)} /> : "",
    status: i.status, payment: i.payment, total: i.total, currency: i.currency, to: i.to,
    ...(withActions ? {
      actions: i.anomaly ? (
        <Cell
          type="actionIcons" alignment="end"
          actions={[{ label: "Ask BP AI why", icon: "auto_awesome", onClick: () => askWhy(i.id) }]}
          menu={[
            { label: "Mark as not an anomaly", icon: "thumb_down", onClick: () => openFeedback(i.id) },
            { label: "Open invoice", icon: "open_in_new", onClick: () => toInvoice(i.id) },
          ]}
        />
      ) : "",
    } : {}),
  });

  const billingScreen = () => {
    const q = invoiceQuery.trim().toLowerCase();
    const filterCount = [anomalyFilter.length > 0, statusFilter, paymentFilter, currencyFilter].filter(Boolean).length;
    const shown = invoices.filter((i) =>
      (!q || i.number.toLowerCase().includes(q) || i.account.toLowerCase().includes(q)) &&
      (anomalyFilter.length === 0 || (i.anomaly !== null && anomalyFilter.includes(i.anomaly))) &&
      (!statusFilter || i.status === statusFilter) && (!paymentFilter || i.payment === paymentFilter) && (!currencyFilter || i.currency === currencyFilter));
    const single = (label: string, value: string | undefined, set: (v: string | undefined) => void, options: string[]) => (
      <Dropdown
        trigger="filter" size="sm" label={label} text={value}
        items={options.map((o) => ({ id: o, label: o, selected: o === value }))}
        onSelect={(id) => set(id === value ? undefined : id)}
      />
    );
    const header = <PageHeader title="Invoices" breadcrumbs={[{ label: "Home", href: "#" }, { label: "Billing", href: "#" }]} />;
    if (assistantOpen) {
      // Beside the assistant the list gives up its tools and its wider columns, as on the canvas.
      return {
        header,
        body: (
          <Section title="All invoices">
            <Table
              caption="Flagged invoices"
              columns={[{ key: "invoice", header: "Invoice", emphasis: true }, { key: "account", header: "Account", maxWidth: "200px" }, { key: "anomaly", header: "Anomaly" }, { key: "total", header: "Grand total", numeric: true }, { key: "actions", header: "", alignment: "end" }]}
              rows={invoices.filter((i) => i.anomaly).map((i) => invoicesRow(i, true))}
            />
          </Section>
        ),
      };
    }
    return {
      header,
      body: (
        <>
          {!noticeClosed && flagTotal > 0 && (
            <Callout intent="warning" actionLabel="Show only flagged invoices" onAction={showFlagged} closeButton onDismiss={() => setNoticeClosed(true)}>
              {flagTotal} invoices on this list may have unusual charges: {flagCounts.Rate} rate, {flagCounts["Missing recurring fee"]} missing recurring fee, {flagCounts["Duplicate charge"]} duplicate charge.
            </Callout>
          )}
          <ListPage
            label="All invoices"
            state={shown.length === 0 ? "empty" : "ready"}
            toolbar={
              <Toolbar
                label="Invoices" searchPlaceholder="Search invoices" searchValue={invoiceQuery} onSearchChange={setInvoiceQuery}
                filtersOpen={filtersOpen} onFiltersOpenChange={setFiltersOpen} filterCount={filterCount} onReset={resetFilters}
                filterHelp="Anomaly comes from Anomaly detection. Pick one or more types, like any other filter."
                filters={
                  <>
                    {single("Status", statusFilter, setStatusFilter, ["Current", "Collections"])}
                    <Dropdown
                      trigger="filter" size="sm" label="Anomaly" multiple closeOnSelect={false} count={anomalyFilter.length}
                      text={anomalyFilter.length ? ANOMALY_FILTER.filter((a) => anomalyFilter.includes(a.id)).map((a) => a.short).join(", ") : undefined}
                      items={ANOMALY_FILTER.map((a) => ({ id: a.id, label: a.label, selected: anomalyFilter.includes(a.id) }))}
                      onSelect={(id) => setAnomalyFilter((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))}
                    />
                    {single("Payment status", paymentFilter, setPaymentFilter, ["Paid", "Unpaid", "Partial", "Overdue"])}
                    {single("Currency", currencyFilter, setCurrencyFilter, ["USD", "EUR", "GBP"])}
                  </>
                }
                selectedCount={selected.length}
                onRefresh={() => notify({ intent: "info", title: "Invoices are up to date" })}
                actions={<Button size="sm" iconStart="download" onClick={() => notify({ intent: "info", title: `Exporting ${shown.length} invoices` })}>Export</Button>}
              />
            }
            empty={<EmptyState headingLevel={2} icon="search_off" title="No invoices match" description="Try different filters or another search." actions={<Button size="sm" iconStart="filter_alt_off" onClick={() => { resetFilters(); setInvoiceQuery(""); }}>Clear filters and search</Button>} />}
          >
            <Table
              selectable selected={selected} onSelectionChange={setSelected} rowLabel="id"
              columns={[
                { key: "invoice", header: "Invoice", emphasis: true },
                { key: "account", header: "Account", maxWidth: "200px" },
                { key: "anomaly", header: "Anomaly" },
                { key: "status", header: "Status" },
                { key: "payment", header: "Payment" },
                { key: "total", header: "Grand total", numeric: true },
                { key: "currency", header: "Currency" },
                { key: "to", header: "To date" },
                { key: "actions", header: "", alignment: "end" },
              ]}
              rows={shown.map((i) => invoicesRow(i, true))}
            />
          </ListPage>
        </>
      ),
    };
  };

  const invoiceScreen = (i: Invoice) => {
    const pills = i.pills ?? (i.anomaly ? [i.anomaly] : []);
    const record = (
      <RecordPage
        label="Invoice" columns={2}
        header={
          <PageHeader
            title={i.number} badge="Closed"
            breadcrumbs={[{ label: "Home", href: "#" }, { label: "Billing", href: "#" }, { label: "Invoices", onClick: () => { setChatInvoiceId(null); setView("billing"); } }]}
            actions={<Button size="sm" iconStart="download" onClick={() => notify({ intent: "info", title: `Downloading ${i.number}.pdf` })}>Download</Button>}
          />
        }
        tabs={<Tabs label="Invoice sections" value={invoiceTab} onChange={setInvoiceTab} items={[{ id: "details", label: "Details" }, { id: "charges", label: "Charges" }, { id: "payments", label: "Payments" }]} />}
        notice={i.anomaly && !detailNoticeClosed ? (
          <Callout intent="warning" title="Possible problems on this invoice" actionLabel="Ask BP AI why" onAction={() => askWhy(i.id)} closeButton onDismiss={() => setDetailNoticeClosed(true)}>
            {/* The Callout's message is a paragraph, so the row has to be a span. */}
            <span className={styles.pills}>
              {pills.map((p) => <Button key={p} size="sm" iconEnd="chevron_right" onClick={() => askWhy(i.id)}>{p}</Button>)}
            </span>
          </Callout>
        ) : undefined}
      >
        {invoiceTab === "details" ? (
          <Section title="Invoice information">
            <FormDisplay label="Account" value={i.account} />
            <FormDisplay label="Billing profile" value={i.profile} />
            <FormDisplay label="Status" value="Closed" />
            <FormDisplay label="Payment" value={i.payment} />
            <FormDisplay label="Grand total" value={i.total} />
            <FormDisplay label="Currency" value={i.currency} />
            <FormDisplay label="Close date" value={i.closeDate} />
            <FormDisplay label="To date" value={i.to} />
          </Section>
        ) : (
          <EmptyState title="Not part of this prototype" description="Only the Details tab has content here." />
        )}
      </RecordPage>
    );
    return { header: undefined, body: record };
  };

  // The answer stays what it was after feedback clears the flag.
  const asked = chatInvoice ? { ...chatInvoice, anomaly: INVOICES.find((x) => x.id === chatInvoice.id)?.anomaly ?? chatInvoice.anomaly } : null;
  const assistant = chatInvoice && asked ? (
    <ChatWindow
      title="BP AI" size="panel" onClose={() => setChatInvoiceId(null)} onNewChat={() => { setTurns([]); setVote([]); }}
      notice="BP AI can make mistakes. Check important details."
      composer={<ChatComposer key={chatInvoice.id} scopeLabel={chatInvoice.number} defaultScoped placeholder="Ask about this invoice" onSend={sendChat} />}
    >
      <ChatMessage author="assistant" actions={["copy"]} text={`This list has ${flagTotal} flagged invoices: ${flagCounts.Rate} rate, ${flagCounts["Missing recurring fee"]} missing recurring fee and ${flagCounts["Duplicate charge"]} duplicate charge. Pick one and ask me why it was flagged.`} />
      <ChatMessage author="user" person={{ name: "Sayra Bunch" }} text={`Why was ${chatInvoice.number} flagged?`} />
      <ChatMessage
        author="assistant"
        text={`${chatInvoice.number} has ${anomalyPhrase(asked)} anomaly.`}
        sections={[
          { id: "why", label: "Why it was flagged", defaultOpen: true, content: whyFlagged(asked) },
          { id: "scope", label: "What your feedback changes", content: `Thumbs down asks you why, then stops flagging this for ${chatInvoice.account} only. Other billing profiles keep being checked.` },
        ]}
        actions={["copy", "up", "down"]} pressed={vote}
        onAction={(a) => {
          if (a === "down" && chatInvoice.anomaly) openFeedback(chatInvoice.id);
          if (a === "up") setVote((v) => (v.includes("up") ? v.filter((x) => x !== "up") : ["up"]));
          if (a === "copy") notify({ intent: "info", title: "Copied" });
        }}
        suggestions={[{ id: "other", label: "Show other rate anomalies" }, { id: "contract", label: "Open the contract" }]}
        onSuggestion={(id) => {
          if (id === "other") { setChatInvoiceId(null); setAnomalyFilter(["Rate"]); setFiltersOpen(true); setView("billing"); }
          else notify({ intent: "info", title: "Not part of this prototype", description: "The contract isn't in the sample data." });
        }}
      />
      {turns.map((t) => (
        <ChatMessage
          key={t.id} author={t.author} text={t.text}
          person={t.author === "user" ? { name: "Sayra Bunch" } : undefined}
          actions={t.author === "assistant" ? ["copy"] : undefined}
          apply={t.openInvoice ? { label: `Open ${invoiceById(t.openInvoice)?.number}`, onApply: () => toInvoice(t.openInvoice as string) } : undefined}
        />
      ))}
    </ChatWindow>
  ) : undefined;

  const screen = (() => {
    switch (view) {
      case "invoices": return invoicesScreen();
      case "compare": return compareScreen();
      case "check": return checkScreen();
      case "billing": return billingScreen();
      case "invoice": return openInvoice ? invoiceScreen(openInvoice) : billingScreen();
    }
    if (!active) return listScreen();
    switch (view) {
      case "training": return trainingScreen(active);
      case "stopped": return stoppedScreen(active);
      case "results": return resultsScreen(active);
      case "applying": return applyingScreen(active);
      case "ready": return readyScreen(active);
      case "saved": return savedScreen(active);
      default: return listScreen();
    }
  })();

  const deletingConfig = configs.find((c) => c.id === deleting);

  return (
    <div className={styles.frame} ref={frame}>
      <AppShell
        header={
          <AppHeader
            navOpen={navOpen} onNavToggle={() => setNavOpen((o) => !o)}
            environment={billingSide ? "COBALT" : "DEV"} environmentIntent={billingSide ? "info" : undefined} searchShortcut="Ctrl+K"
            onSearch={() => notify({ intent: "info", title: "Not part of this prototype" })}
            actions={[{ id: "guide", label: "Prototype guide", icon: "science" }]} onAction={() => setGuideOpen(true)}
            user={{ name: "Sayra Bunch" }} company={{ name: "CCC" }}
          />
        }
        nav={<AppNav items={APP_NAV} endItems={APP_NAV_END} current={billingSide ? INVOICES_PAGE : AI_SETTINGS} onNavigate={navigate} expanded={navOpen} />}
        navOpen={navOpen} onNavClose={() => setNavOpen(false)}
        pageHeader={screen.header}
        assistant={assistant}
        assistantOpen={assistantOpen}
      >
        {/* A closed Callout stays closed only on its own screen: a new screen, or the other sample result, starts fresh. */}
        <Fragment key={`${view}-${activeId}-${active?.result?.kind}`}>{screen.body}</Fragment>
      </AppShell>

      <AlertDialog
        open={stopping} title="Stop training?" description="It stops right away and progress so far is lost. Your settings stay saved."
        cancelLabel="Keep training" actionLabel="Stop training" actionIntent="danger"
        onCancel={() => setStopping(false)} onAction={stopTraining}
      />
      <AlertDialog
        open={discarding}
        title={editingFrom ? "Discard your changes?" : "Discard this draft?"}
        description={editingFrom ? "The configuration goes back to how it was. To keep your changes, use Continue later." : "Nothing you entered is kept. To keep it in Drafts, use Continue later."}
        cancelLabel="Keep editing" actionLabel="Discard" actionIntent="danger"
        onCancel={() => setDiscarding(false)} onAction={discard}
      />
      <AlertDialog
        open={deleting !== null} title={`Delete ${deletingConfig?.setup.name ?? "configuration"}?`}
        description="Its settings and results go too. Flags it already raised stay on the invoices."
        actionLabel="Delete" actionIntent="danger" onCancel={() => setDeleting(null)} onAction={confirmDelete}
      />
      <Modal
        open={feedbackInvoice !== null} title="Why isn't this an anomaly?" size="md" onClose={() => setFeedbackFor(null)}
        footer={
          <>
            <Button size="sm" onClick={() => setFeedbackFor(null)}>Cancel</Button>
            <Button size="sm" emphasis="strong" intent="brand" onClick={sendFeedback}>Send feedback</Button>
          </>
        }
      >
        <div className="layout-stack">
          {feedbackInvoice && <Callout closeButton intent="info">{feedbackScope(feedbackInvoice)}</Callout>}
          <Form labelPosition="start" labelWidth="sm">
            <Textarea
              label="Reason" required value={reason} error={reasonError}
              onChange={(v) => { setReason(v); setReasonError(undefined); }}
              placeholder="We agreed this rate with the customer in a contract change that isn't on file yet."
              hint="The model uses this to learn what's normal for this billing profile."
            />
          </Form>
        </div>
      </Modal>
      <Modal
        open={picker !== null} size="lg" onClose={() => setPicker(null)}
        title={picker?.kind === "value" ? "Add a value to watch" : "Add a condition"}
        description="Start with the suggestions, or open related records to reach their fields."
        footer={
          <>
            <Button size="sm" onClick={() => setPicker(null)}>Cancel</Button>
            <Button size="sm" emphasis="strong" intent="brand" disabled={!picker?.names.length} onClick={addPicked}>Add</Button>
          </>
        }
      >
        <div className="layout-stack">
          <Cascader
            key={picker?.kind} label="Invoice fields" variant="panel" searchable
            options={picker?.kind === "value" ? withoutUsed(VALUE_TREE, setup.values.map((v) => v.id)) : withoutUsed(FIELD_TREE, setup.conditions.map((c) => c.field ?? ""))}
            value={picker?.path ?? []}
            onChange={(path, options) => {
              // A suggested field names where it really lives, not the Suggested group.
              const last = options[options.length - 1];
              const names = path[0] === SUGGESTED ? [last.path, last.label].filter((n): n is string => Boolean(n)) : options.map((o) => o.label);
              setPicker((p) => p && { ...p, path, names });
            }}
          />
          <div><FormDisplay label="You have selected" value={picker?.names.join(" / ")} empty="Nothing yet" labelPosition="start" /></div>
        </div>
      </Modal>
      <Drawer
        open={guideOpen} title="Prototype guide" description="Sample data only. Nothing is saved, and a reload starts over." size="medium" onClose={() => setGuideOpen(false)}
        footer={<Button size="sm" iconStart="restart_alt" onClick={resetAll}>Start over</Button>}
      >
        <div className="layout-stack">
          <Section title="Jump to a flow">
            <div className={styles.guideFlows}>
              <Button emphasis="minimal" intent="brand" onClick={() => { jump("list"); newConfiguration(); }}>1. Create a configuration</Button>
              <Button emphasis="minimal" intent="brand" onClick={() => jump("training")}>2. Training in progress</Button>
              <Button emphasis="minimal" intent="brand" onClick={() => jump("results")}>3. Results</Button>
              <Button emphasis="minimal" intent="brand" onClick={() => jump("saved")}>4. A saved configuration</Button>
              <Button emphasis="minimal" intent="brand" onClick={() => jump("billing")}>5. Billing user: flagged invoices</Button>
            </div>
          </Section>
          <Section title="Show a state">
            <div className={styles.guideFlows}>
              <Button emphasis="minimal" intent="brand" onClick={() => showCheck(false)}>Check data: ready</Button>
              <Button emphasis="minimal" intent="brand" onClick={() => showCheck(true)}>Check data: field error</Button>
              <Button emphasis="minimal" intent="brand" onClick={() => showResultState("good")}>Results: good</Button>
              <Button emphasis="minimal" intent="brand" onClick={() => showResultState("poor")}>Results: poor</Button>
            </div>
          </Section>
          <Section title={NOT_CONFIRMED}>
            <div>
              {UNCONFIRMED.map((u) => <FormDisplay key={u.id} label={u.label} value={u.text} />)}
            </div>
          </Section>
          <Section title="Stand-ins">
            <div>
              <FormDisplay label="Field picker" value="The kit Cascader, in place of the product's Select Field dialog and the Model Browser pattern." />
              <FormDisplay label="Invoices list" value="Shows part of the flagged invoices its banner counts." />
            </div>
          </Section>
        </div>
      </Drawer>
      {notes.map(({ key, ...n }) => (
        <Toast key={key} {...n} open onClose={() => setNotes((all) => all.filter((x) => x.key !== key))} />
      ))}
    </div>
  );
}
