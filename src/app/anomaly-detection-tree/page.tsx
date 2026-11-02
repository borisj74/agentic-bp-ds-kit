"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { AlertDialog } from "@/ui/AlertDialog/AlertDialog";
import { AppHeader } from "@/ui/AppHeader/AppHeader";
import { AppNav } from "@/ui/AppNav/AppNav";
import { Badge } from "@/ui/Badge/Badge";
import { Button } from "@/ui/Button/Button";
import { ButtonGroup } from "@/ui/ButtonGroup/ButtonGroup";
import { Callout } from "@/ui/Callout/Callout";
import { Drawer } from "@/ui/Drawer/Drawer";
import { Dropdown } from "@/ui/Dropdown/Dropdown";
import { Icon } from "@/ui/Icon/Icon";
import { Input } from "@/ui/Input/Input";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Section } from "@/ui/Section/Section";
import { Steps } from "@/ui/Steps/Steps";
import { Toast, type ToastProps } from "@/ui/Toast/Toast";
import { BlockSettings } from "../anomaly-detection-nodes/BlockSettings";
import { AGG_OPTIONS, TODAY } from "../anomaly-detection/data";
import { ACTION_OPTIONS, BLOCKS, RECORDS, RECORD_OPTIONS, actionOptions, blockLabel, blockText, blockUnset, freshId, recordOf, summarize, type BlockKind, type RecordType, type ValuesBlock, type WatchRow } from "../anomaly-detection-nodes/graph";
import { CheckData } from "./CheckData";
import { RulesList } from "./RulesList";
import { RunPanel, RunProgress } from "./RunPanel";
import {
  ROOT, bestSpot, blankRule, countRule, isChoosing, findStep, insertStep, missingSteps, moveRefusal, moveStep, newRecord, nextNeeded, patchStep, removeStep, resultOf, seedRecords, setModelBranches, spotId, spots, toGraph, whyNot,
  type BuildItem, type Counts, type Path, type Rule, type RuleRecord, type Spot, type Stage, type Step,
} from "./tree";
import styles from "./page.module.css";

// Settings › Anomaly detection as a tidy tree: blocks snap into place and there is nothing to wire up. Local state only.

const CARD_WIDTH = 272;
const HISTORY_LIMIT = 50;
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 1.2;
const ZOOM_STEP = 0.1;
const START_ZOOM = 0.7;
const WHEEL_SPEED = 0.002;
const PINCH_SPEED = 0.01;
const LINE_HEIGHT = 16;
const FIT_MARGIN = 48;
const DRAG_START = 4;
const DROP_REACH = 72;

const iconOf = (kind: BlockKind) => BLOCKS.find((b) => b.kind === kind)!.icon;
const item = (kind: BlockKind): BuildItem => ({ id: kind, kind, label: blockLabel(kind), icon: iconOf(kind) });
const ACTION_ITEMS: BuildItem[] = ACTION_OPTIONS.map((a) => ({ id: `action:${a.value}`, kind: "action", act: a.value, label: a.label, icon: iconOf("action") }));
const BUILD_GROUPS: { title: string; items: BuildItem[] }[] = [
  { title: "Narrow it down", items: [item("condition")] },
  { title: "What to compare", items: [item("comparePer"), item("values")] },
  { title: "Find anomalies", items: [item("model")] },
  { title: "When flagged", items: ACTION_ITEMS },
];
const ALL_ITEMS = BUILD_GROUPS.flatMap((g) => g.items);
const findItem = (id: string) => ALL_ITEMS.find((i) => i.id === id)!;

const RUN_STEPS = ["Build rule", "Train", "Results", "Turn on"];
const RUN_STEP: Record<Stage, number> = { build: 1, training: 2, results: 3, applying: 4, ready: 4, on: 5 };
const RUN_TICK = 400;
// What each required step is for, in plain words, shown when it's the next thing a rule needs.
const nextWhy = (kind: BlockKind, type: RecordType) => ({
  comparePer: `What each ${type.one} is compared against. ${type.compareHint}`,
  values: `The numbers that could look unusual, like ${type.valueHint}.`,
  model: `Learns what normal looks like from past ${type.many}, then flags what doesn't fit.`,
}[kind as string]);
// An Action reads as what it does to this rule's kind of record.
const itemLabel = (it: BuildItem, type: RecordType) => (it.act ? actionOptions(type).find((a) => a.value === it.act)?.label ?? it.label : it.label);
const stepLabel = (kind: BlockKind, type: RecordType) => (kind === "invoices" ? type.label : blockLabel(kind));
const DETAILS_TITLE: Record<Stage, string> = { build: "", training: "Training", results: "Results", applying: "Applying", ready: "Ready to turn on", on: "Detection" };
// Move the view by scrolling as far as it goes; the rest becomes an offset on the tree.
const moveView = (box: HTMLElement, dx: number, dy: number, setOffset: (update: (o: { x: number; y: number }) => { x: number; y: number }) => void) => {
  const { scrollLeft, scrollTop } = box;
  box.scrollLeft = scrollLeft + dx;
  box.scrollTop = scrollTop + dy;
  const restX = dx - (box.scrollLeft - scrollLeft);
  const restY = dy - (box.scrollTop - scrollTop);
  if (restX || restY) setOffset((o) => ({ x: o.x - restX, y: o.y - restY }));
};
const recordKey = (type: RecordType) => RECORD_OPTIONS.find((o) => o.label === type.label)!.value;
const countWord = (n: number, one: string) => `${n.toLocaleString("en-US")} ${one}${n === 1 ? "" : "s"}`;

type Note = Omit<ToastProps, "open" | "onClose"> & { key: number };
interface History { past: Rule[]; present: Rule; future: Rule[]; key: string | null }
// `moving` is the step being moved; without it, a new block is coming from the Build panel.
interface Dragged { item: BuildItem; moving?: string; x: number; y: number; over: string | null }

const stepBack = (h: History): History =>
  h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future], key: null } : h;
const stepForward = (h: History): History =>
  h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1), key: null } : h;

// What the tree needs from the screen, passed down through every level of it.
interface TreeUi {
  selected: string | null;
  openValues: string | null;
  next: { seq: string; index: number; kind: BlockKind } | null;
  blank: boolean;
  type: RecordType;
  onRecord: (record: string) => void;
  naming: boolean;
  ruleName: string;
  onName: (name: string) => void;
  onNamed: () => void;
  dragged: Dragged | null;
  spotsById: Map<string, Spot>;
  readOnly: boolean;
  counts: Counts | null;
  refusal: (spot: Spot) => string | null;
  onRows: (id: string, rows: WatchRow[]) => void;
  onCardDown: (e: ReactPointerEvent<HTMLElement>, s: Step) => void;
  onCardClick: (s: Step) => void;
  onOpen: (s: Step) => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onInsert: (spot: Spot, it: BuildItem) => void;
}

// The list and the rule being looked at. Runs tick along here, so leaving a rule's page doesn't stop its run.
export default function AnomalyTreePage() {
  const [records, setRecords] = useState<RuleRecord[]>(seedRecords);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const noteKey = useRef(0);
  const onPatch = useCallback((id: string, change: Partial<RuleRecord>) => {
    setRecords((all) => all.map((r) => (r.id === id ? { ...r, ...change } : r)));
  }, []);
  // The Stop dialog holds a run's clock, so it can't finish behind it.
  useEffect(() => {
    if (!records.some((r) => (r.stage === "training" || r.stage === "applying") && !r.held)) return;
    const timer = setTimeout(() => {
      const running = records.filter((r) => (r.stage === "training" || r.stage === "applying") && !r.held);
      setRecords((all) => all.map((r) => {
        if (!running.some((x) => x.id === r.id)) return r;
        if (r.progress < 100) return { ...r, progress: Math.min(100, r.progress + (r.stage === "training" ? 4 : 5)) };
        return r.stage === "training"
          ? { ...r, stage: "results", progress: 0, detailsFor: "results", result: resultOf(r.rule), trained: TODAY }
          : { ...r, stage: "ready", progress: 0, detailsFor: "ready" };
      }));
      const finished = running.filter((r) => r.progress >= 100 && r.id !== openId);
      if (finished.length) {
        const r = finished[0];
        setNotes([{
          key: ++noteKey.current, intent: "success", actionLabel: "Open", onAction: () => setOpenId(r.id),
          title: `${r.rule.name}: ${r.stage === "training" ? "results are ready" : "ready to turn on"}`,
        }]);
      }
    }, RUN_TICK);
    return () => clearTimeout(timer);
  }, [records, openId]);

  const create = () => {
    const made = newRecord(blankRule());
    setRecords((all) => [made, ...all]);
    setOpenId(made.id);
  };
  const copy = (id: string) => {
    setRecords((all) => {
      const from = all.find((r) => r.id === id);
      return from ? [{ ...newRecord({ ...from.rule, name: `${from.rule.name} copy` }) }, ...all] : all;
    });
    setNotes([{ key: ++noteKey.current, intent: "success", title: "Copy saved as a draft" }]);
  };
  const remove = (id: string) => {
    const gone = records.find((r) => r.id === id);
    setRecords((all) => all.filter((r) => r.id !== id));
    setNotes([{ key: ++noteKey.current, intent: "success", title: `${gone?.rule.name || "Rule"} deleted` }]);
  };
  const open = records.find((r) => r.id === openId);
  return (
    <>
      {open
        ? <RuleEditor key={open.id} record={open} onPatch={onPatch} onBack={() => setOpenId(null)} />
        : <RulesList records={records} onOpen={setOpenId} onCreate={create} onCopy={copy} onDelete={remove} />}
      {notes.map(({ key, ...n }) => (
        <Toast key={key} {...n} open onClose={() => setNotes((all) => all.filter((x) => x.key !== key))} />
      ))}
    </>
  );
}

function RuleEditor({ record, onPatch, onBack }: { record: RuleRecord; onPatch: (id: string, change: Partial<RuleRecord>) => void; onBack: () => void }) {
  const [navOpen, setNavOpen] = useState(false);
  const [history, setHistory] = useState<History>(() => ({ past: [], present: record.rule, future: [], key: null }));
  const rule = history.present;
  useEffect(() => { onPatch(record.id, { rule }); }, [rule, record.id, onPatch]);
  const { stage, progress, paused, live, detailsFor, held: stopping } = record;
  const setStage = (next: Stage) => onPatch(record.id, { stage: next });
  const setProgress = (next: number) => onPatch(record.id, { progress: next });
  const setStopping = (next: boolean) => onPatch(record.id, { held: next });
  const setPaused = (next: boolean) => onPatch(record.id, { paused: next });
  const setLive = (next: boolean) => onPatch(record.id, { live: next });
  const setDetailsFor = (next: Stage | null) => onPatch(record.id, { detailsFor: next });
  const [zoom, setZoom] = useState(rule.blank ? 1 : START_ZOOM);
  const [selected, setSelected] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [dragged, setDragged] = useState<Dragged | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [checking, setChecking] = useState(false);
  // A new rule's first step is its name. The card stays until it's confirmed, so it doesn't vanish on the first letter typed.
  const [naming, setNaming] = useState(!rule.name.trim());
  const [buildOpen, setBuildOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  // The Values card showing its chips. One at a time; an empty one always shows them, so Add value is right there.
  const [openValues, setOpenValues] = useState<string | null>(null);
  const [panning, setPanning] = useState(false);
  // How far the view has moved beyond what scrolling allows, so it can always be dragged, even when the whole tree fits.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const canvas = useRef<HTMLDivElement>(null);
  const tree = useRef<HTMLDivElement>(null);
  const zoomAnchor = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);
  const focusNext = useRef<string | null>(null);
  const noteKey = useRef(0);
  const swallowClick = useRef(false);

  const notify = (n: Omit<Note, "key">) => setNotes([{ ...n, key: ++noteKey.current }]);
  const notHere = () => notify({ intent: "info", title: "Not available from this screen" });
  const setRule = (update: (r: Rule) => Rule, key?: string) =>
    setHistory((h) => {
      const next = update(h.present);
      if (next === h.present) return h;
      const sameRun = key !== undefined && h.key === key;
      return { past: sameRun ? h.past : [...h.past, h.present].slice(-HISTORY_LIMIT), present: next, future: [], key: key ?? null };
    });
  const undo = () => setHistory(stepBack);
  const redo = () => setHistory(stepForward);

  const stepEl = (id: string) => tree.current?.querySelector<HTMLElement>(`[data-step="${id}"]`) ?? null;

  // The rule is fixed while it runs, so undo only listens while building.
  useEffect(() => {
    if (stage !== "build") return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) { e.preventDefault(); setHistory(stepBack); }
      else if ((key === "z" && e.shiftKey) || key === "y") { e.preventDefault(); setHistory(stepForward); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage]);
  // Scrolling zooms. Shift+scroll and sideways swipes still move the view. Added by hand because React's onWheel can't stop the page scrolling.
  useEffect(() => {
    const box = canvas.current;
    if (!box) return;
    const onWheel = (e: WheelEvent) => {
      const el = tree.current;
      if (!el || e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if ((e.target as Element).closest("[role=menu], [role=listbox]")) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAnchor.current = { x: e.clientX, y: e.clientY, fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
      const delta = e.deltaY * (e.deltaMode === WheelEvent.DOM_DELTA_LINE ? LINE_HEIGHT : 1);
      const factor = Math.exp(-delta * (e.ctrlKey ? PINCH_SPEED : WHEEL_SPEED));
      setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * factor * 100) / 100)));
    };
    box.addEventListener("wheel", onWheel, { passive: false });
    return () => box.removeEventListener("wheel", onWheel);
  }, []);
  // After a scroll zoom, keep the spot under the pointer where it was.
  useLayoutEffect(() => {
    const anchor = zoomAnchor.current;
    const box = canvas.current;
    const el = tree.current;
    zoomAnchor.current = null;
    if (!anchor || !box || !el) return;
    const r = el.getBoundingClientRect();
    moveView(box, r.left + anchor.fx * r.width - anchor.x, r.top + anchor.fy * r.height - anchor.y, setOffset);
  }, [zoom]);
  // A new step takes focus and comes into view, wherever in the tree it landed.
  useEffect(() => {
    if (!focusNext.current) return;
    const el = stepEl(focusNext.current);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    focusNext.current = null;
  }, [rule]);
  useEffect(() => {
    if (editing) stepEl(editing)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [editing]);

  const graph = useMemo(() => toGraph(rule), [rule]);
  const summary = useMemo(() => summarize(graph), [graph]);
  const type = recordOf(rule.start.record);
  const missing = useMemo(() => missingSteps(rule), [rule]);
  const allSpots = useMemo(() => spots(rule), [rule]);
  const spotsById = useMemo(() => new Map(allSpots.map((s) => [spotId(s), s])), [allSpots]);
  const editStep = findStep(rule, editing);
  const overSpot = dragged?.over ? spotsById.get(dragged.over) : undefined;
  const refusalFor = (spot: Spot) => {
    if (!dragged) return null;
    return dragged.moving ? moveRefusal(rule, dragged.moving, spot) : whyNot(dragged.item.kind, spot);
  };
  const overWhy = overSpot ? refusalFor(overSpot) : null;
  const building = stage === "build";
  const detailsOpen = !building && detailsFor === stage;
  const result =useMemo(() => resultOf(rule), [rule]);
  const fullCounts = useMemo(() => countRule(rule, "all", result), [rule, result]);
  const sampleCounts = useMemo(() => countRule(rule, "sample", result), [rule, result]);
  // Results and applying only know the sample; once all invoices are checked, the tree shows all of them.
  const counts = stage === "results" || stage === "applying" ? sampleCounts : stage === "ready" || stage === "on" ? fullCounts : null;

  const zoomTo = (value: number) => setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 10) / 10)));
  const fit = () => {
    const box = canvas.current;
    const el = tree.current;
    if (!box || !el) return;
    const shown = el.getBoundingClientRect();
    const room = Math.min((box.clientWidth - FIT_MARGIN) / (shown.width / zoom), (box.clientHeight - FIT_MARGIN) / (shown.height / zoom));
    setZoom(Math.min(1, Math.max(ZOOM_MIN, Math.floor(room * 10) / 10)));
    setOffset({ x: 0, y: 0 });
    box.scrollTo(0, 0);
  };

  const place = (spot: Spot, it: BuildItem) => {
    const why = whyNot(it.kind, spot);
    if (why) { notify({ intent: "warning", title: "That can't go there", description: why }); return; }
    const made = insertStep(rule, spot.seq, spot.index, it);
    focusNext.current = made.id;
    setRule(() => made.rule);
    setSelected(made.id);
  };
  const addByPress = (it: BuildItem) => {
    const spot = bestSpot(rule, it.kind, selected);
    if (!spot) {
      notify({ intent: "warning", title: "Nowhere for that yet", description: it.kind === "action" ? "Add a Model first. An Action acts on what it flags." : "Every path already ends in a Model." });
      return;
    }
    place(spot, it);
  };
  const remove = (id: string) => {
    setRule((r) => removeStep(r, id));
    setSelected(null);
    setEditing(null);
    notify({ intent: "info", title: "Step deleted", actionLabel: "Undo", onAction: undo });
  };

  const train = () => {
    if (naming && !isChoosing(rule)) {
      notify({ intent: "warning", title: "Give this rule a name first" });
      canvas.current?.querySelector<HTMLInputElement>("[data-naming] input")?.focus();
      return;
    }
    if (missing.length) {
      const more = missing.length - 1;
      notify({ intent: "warning", title: "This rule isn't ready to train", description: `${missing[0].text}${more ? ` And ${more} more to fix.` : ""}` });
      // The name lives in the Invoices settings, so go straight there.
      setEditing(missing[0].id === rule.start.id && !rule.name.trim() && !isChoosing(rule) ? rule.start.id : null);
      setOpenValues(null);
      setSelected(missing[0].id);
      const el = stepEl(missing[0].id);
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ block: "center", inline: "center" });
      return;
    }
    setNotes([]);
    setEditing(null);
    setChecking(true);
  };
  const startTraining = () => {
    setChecking(false);
    setSelected(null);
    setOpenValues(null);
    setProgress(0);
    setStage("training");
  };
  const stopTraining = () => {
    setStopping(false);
    setProgress(0);
    setStage("build");
    notify({ intent: "warning", title: "Training stopped", description: "Nothing from this run was kept. Your rule hasn't changed." });
  };
  const applyToAll = () => {
    setProgress(0);
    setStage("applying");
  };
  const turnOn = () => {
    setStage("on");
    setPaused(false);
    setLive(false);
    notify({ intent: "success", title: "Detection is on", description: `Only ${type.newOnes} are checked from now on.` });
  };
  const editRule = () => {
    if (stage === "on") setLive(!paused);
    setProgress(0);
    setStage("build");
  };
  const runHeader = (badge: string, badgeIntent: "info" | "warning" | "success" | "neutral", actions: ReactNode) => ({ badge, badgeIntent, actions });
  const skipAhead = <Button size="sm" emphasis="minimal" iconStart="fast_forward" onClick={() => setProgress(100)}>Skip ahead</Button>;
  const header = {
    build: runHeader(live ? "Active" : "", "success", <>
      <Button size="sm" iconOnly iconStart="undo" disabled={!history.past.length} onClick={undo}>Undo</Button>
      <Button size="sm" iconOnly iconStart="redo" disabled={!history.future.length} onClick={redo}>Redo</Button>
      {/* Start training in the Check data Drawer is the one strong Button while that's open. */}
      {checking
        ? <Button size="sm" iconStart="model_training" onClick={train}>{live ? "Train new version" : "Train model"}</Button>
        : <Button size="sm" emphasis="strong" intent="brand" iconStart="model_training" onClick={train}>{live ? "Train new version" : "Train model"}</Button>}
    </>),
    // Where a run has got is for the Steps bar and progress bar. The Badge only says something about the rule itself.
    training: runHeader("", "info", <>
      {skipAhead}
      <Button size="sm" emphasis="minimal" intent="danger" iconStart="stop_circle" onClick={() => setStopping(true)}>Stop training</Button>
    </>),
    results: result.kind === "poor"
      ? runHeader("Needs changes", "warning", <Button size="sm" emphasis="strong" intent="brand" iconStart="tune" onClick={editRule}>Edit rule and retrain</Button>)
      : runHeader("", "info", <>
        <Button size="sm" iconStart="tune" onClick={editRule}>Edit rule and retrain</Button>
        <Button size="sm" emphasis="strong" intent="brand" iconStart="play_arrow" onClick={applyToAll}>{`Apply to all ${type.many}`}</Button>
      </>),
    applying: runHeader("", "info", <>
      {skipAhead}
      <Button size="sm" emphasis="strong" intent="brand" iconStart="power_settings_new" disabled>Turn on detection</Button>
    </>),
    ready: runHeader("", "info", <>
      <Button size="sm" iconStart="tune" onClick={editRule}>Edit rule and retrain</Button>
      <Button size="sm" emphasis="strong" intent="brand" iconStart="power_settings_new" onClick={turnOn}>Turn on detection</Button>
    </>),
    on: paused
      ? runHeader("Paused", "neutral", <>
        <Button size="sm" iconStart="tune" onClick={editRule}>Edit rule</Button>
        <Button size="sm" emphasis="strong" intent="brand" iconStart="power_settings_new" onClick={() => setPaused(false)}>Turn on detection</Button>
      </>)
      : runHeader("Active", "success", <>
        <Button size="sm" iconStart="tune" onClick={editRule}>Edit rule</Button>
        <Button size="sm" iconStart="pause" onClick={() => setPaused(true)}>Pause detection</Button>
      </>),
  }[stage];

  // The + nearest the pointer, so a drop doesn't have to land exactly on it.
  const nearestSpot = (x: number, y: number) => {
    let best: string | null = null;
    let bestDistance = DROP_REACH;
    tree.current?.querySelectorAll<HTMLElement>("[data-spot]").forEach((el) => {
      const r = el.getBoundingClientRect();
      const distance = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
      if (distance < bestDistance) { bestDistance = distance; best = el.dataset.spot!; }
    });
    return best as string | null;
  };
  const moveTo = (id: string, spot: Spot) => {
    const why = moveRefusal(rule, id, spot);
    if (why) { notify({ intent: "warning", title: "That can't go there", description: why }); return; }
    const next = moveStep(rule, id, spot.seq, spot.index);
    if (next === rule) return;
    focusNext.current = id;
    setRule(() => next);
    setSelected(id);
  };
  const startDrag = (e: ReactPointerEvent<HTMLElement>, it: BuildItem, moving?: string) => {
    if (e.button !== 0) return;
    const start = { x: e.clientX, y: e.clientY };
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < DRAG_START) return;
      moved = true;
      setDragged({ item: it, moving, x: ev.clientX, y: ev.clientY, over: nearestSpot(ev.clientX, ev.clientY) });
    };
    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
    const onUp = (ev: PointerEvent) => {
      stop();
      setDragged(null);
      if (!moved) return;
      swallowClick.current = true;
      setTimeout(() => { swallowClick.current = false; }, 0);
      const id = nearestSpot(ev.clientX, ev.clientY);
      const spot = id ? spotsById.get(id) : undefined;
      if (spot) { if (moving) moveTo(moving, spot); else place(spot, it); }
    };
    const onCancel = () => { stop(); setDragged(null); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  };

  // Scrolling zooms, so dragging the empty canvas is how the view moves. A press on its scrollbars is left alone.
  const startPan = (e: ReactPointerEvent<HTMLDivElement>) => {
    const box = canvas.current;
    if (!box || e.button !== 0 || (e.target as Element).closest(building ? "[data-step], [data-values], [data-naming], button" : "button")) return;
    setSelected(null);
    setOpenValues(null);
    const r = box.getBoundingClientRect();
    if (e.clientX >= r.left + box.clientLeft + box.clientWidth || e.clientY >= r.top + box.clientTop + box.clientHeight) return;
    let last = { x: e.clientX, y: e.clientY };
    const onMove = (ev: PointerEvent) => {
      setPanning(true);
      moveView(box, last.x - ev.clientX, last.y - ev.clientY, setOffset);
      last = { x: ev.clientX, y: ev.clientY };
    };
    const stop = () => {
      setPanning(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  };

  const ui: TreeUi = {
    type, onRecord: (next) => { setNotes([]); setRule((r) => patchStep(r, r.start.id, { record: next })); }, naming, ruleName: rule.name, onName: (name) => setRule((r) => ({ ...r, name }), "name"), onNamed: () => setNaming(false),
    selected, openValues, next: building ? nextNeeded(rule) : null, blank: rule.steps.length === 0, dragged, spotsById, readOnly: !building, counts,
    refusal: refusalFor,
    onRows: (id, rows) => { setOpenValues(id); setRule((r) => patchStep(r, id, { rows })); },
    onCardDown: (e, s) => { if (s.kind !== "invoices") startDrag(e, { id: s.id, kind: s.kind, label: blockLabel(s.kind), icon: iconOf(s.kind) }, s.id); },
    // Pressing a Values card opens its chips; every other card opens its settings.
    onCardClick: (s) => {
      if (swallowClick.current) return;
      setSelected(s.id);
      if (s.kind === "values") { setEditing(null); setOpenValues((o) => (o === s.id ? null : s.id)); return; }
      setOpenValues(null);
      setEditing(s.id);
    },
    onOpen: (s) => { setSelected(s.id); setEditing(s.id); },
    onSelect: setSelected,
    onRemove: remove,
    onInsert: place,
  };

  return (
    <div className={styles.frame}>
      <AppShell
        header={
          <AppHeader
            navOpen={navOpen} onNavToggle={() => setNavOpen((o) => !o)}
            environment="DEV" searchShortcut="Ctrl+K" onSearch={notHere}
            user={{ name: "Sayra Bunch" }} company={{ name: "CCC" }}
          />
        }
        nav={<AppNav items={APP_NAV} endItems={APP_NAV_END} current="settings-ai-settings" onNavigate={notHere} expanded={navOpen} />}
        navOpen={navOpen} onNavClose={() => setNavOpen(false)}
        pageHeader={
          <PageHeader
            title={rule.name || "Untitled rule"}
            breadcrumbs={[{ label: "Home", href: "#" }, { label: "Settings", href: "#" }, { label: "Anomaly detection", onClick: onBack }]}
            badge={header.badge || undefined} badgeIntent={header.badgeIntent}
            actions={header.actions}
          />
        }
      >
        {building && !rule.blank && (
          <Callout intent="info" closeButton>
            This is an example rule. Branching by anomaly type and acting on a flag are ideas to react to, not something the review agreed.
          </Callout>
        )}
        {building && live && (
          <Callout intent="info" closeButton title="Detection stays on while you edit">
            Flags keep coming from the last trained version until you train this one and turn it on.
          </Callout>
        )}
        {!building && <Steps steps={RUN_STEPS} current={RUN_STEP[stage]} fill label="Rule progress" />}
        <RunProgress stage={stage} progress={progress} checked={fullCounts.checked} type={type} />

        {/* The summary stays in view as one line, so the canvas gets the width and the rule can still be read in words. */}
        {building && (
          <div className={[styles.strip, editStep ? styles.withDrawer : ""].join(" ")}>
            <div className={styles.stripRow}>
              <p className={[styles.stripLead, summaryOpen ? styles.stripLeadOpen : ""].join(" ")} role="status">{summary.lines[0] ?? "This rule doesn't check anything yet."}</p>
              {missing.length > 0 && rule.steps.length > 0 && <Badge intent="warning" size="sm" icon="warning">{`${missing.length} to fix`}</Badge>}
              <Button
                size="sm" emphasis="minimal" iconEnd={summaryOpen ? "expand_less" : "expand_more"}
                aria-expanded={summaryOpen} onClick={() => setSummaryOpen((o) => !o)}
              >
                {summaryOpen ? "Show less" : "Show more"}
              </Button>
              {!editStep && !isChoosing(rule) && <span className={styles.stripNote}>{`Nothing happens to ${type.many} until you turn it on.`}</span>}
            </div>
            {summaryOpen && (
              <div className={styles.summary}>
                {summary.lines.slice(1).map((line) => <p key={line}>{line}</p>)}
                {missing.map((m) => (
                  <p key={`${m.id}${m.text}`} className={styles.problem}><Icon name="warning" size="sm" intent="warning" />{m.text}</p>
                ))}
                <p>Training learns from past {type.many}. Turning on is what starts checking new ones.</p>
              </div>
            )}
          </div>
        )}

        <div className={[styles.workspace, editStep ? styles.withDrawer : ""].join(" ")}>
          <div className={styles.canvasArea}>
            {!building && (
              <div className={styles.canvasTop}>
                <span className={styles.detailsButton}>
                  <Button size="sm" iconStart="info" onClick={() => setDetailsFor(stage)}>Details</Button>
                </span>
                {counts && <span className={styles.scope}>{counts === sampleCounts ? "Counts from the 5% sample" : `Counts from all past ${type.many}`}</span>}
              </div>
            )}
            {building && !editStep && !buildOpen && !isChoosing(rule) && !naming && (
              <div className={styles.addStep}>
                <Button size="sm" iconStart="add" aria-expanded={false} onClick={() => setBuildOpen(true)}>Add step</Button>
              </div>
            )}
            <div className={styles.tools}>
              <ButtonGroup label="Canvas zoom" size="sm">
                <Button iconOnly iconStart="remove" disabled={zoom <= ZOOM_MIN} onClick={() => zoomTo(zoom - ZOOM_STEP)}>Zoom out</Button>
                <Button onClick={() => zoomTo(1)}>{`${Math.round(zoom * 100)}%`}</Button>
                <Button iconOnly iconStart="add" disabled={zoom >= ZOOM_MAX} onClick={() => zoomTo(zoom + ZOOM_STEP)}>Zoom in</Button>
                <Button iconStart="fit_screen" onClick={fit}>Fit</Button>
              </ButtonGroup>
            </div>
            <div
              ref={canvas} className={[styles.canvas, panning ? styles.panning : ""].join(" ")}
              onPointerDown={startPan}
            >
              <div style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
                <div ref={tree} className={styles.tree} role="group" aria-label="Rule steps" style={{ zoom, "--tree-card-width": `${CARD_WIDTH}px` } as CSSProperties}>
                  <div className={styles.seq}>
                    {isChoosing(rule)
                      ? <h2 className={styles.choiceTitle}>What should this rule check?</h2>
                      : <span className={styles.lineLabel}>When this happens</span>}
                    {isChoosing(rule) ? <StartChoice ui={ui} /> : (
                      <>
                        <Card step={rule.start} ui={ui} before={[]} />
                        <Sequence seq={ROOT} steps={rule.steps} before={["invoices"]} ui={ui} firstLabel="This will then happen" />
                        {building && naming && <NameGuide ui={ui} />}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {building && !editStep && buildOpen && !isChoosing(rule) && !naming && (
            <div className={[styles.build, dragged ? styles.buildDragging : ""].join(" ")} onKeyDown={(e) => { if (e.key === "Escape") setBuildOpen(false); }}>
              <div className={styles.buildClose}>
                <Button size="sm" iconOnly emphasis="minimal" iconStart="close" onClick={() => setBuildOpen(false)}>Close</Button>
              </div>
              <Section title="Build" heading="sm" line="thin" spacing="tight" help="Press a block to add it at the next open spot, or drag it onto a + in the tree. You can also press a + to choose what goes there.">
                <div className="layout-stack">
                  {BUILD_GROUPS.map((g) => (
                    <Section key={g.title} title={g.title} heading="xs" line="none" spacing="tight">
                      <div className={styles.items}>
                        {g.items.map((it) => (
                          <Button
                            key={it.id} size="sm" fullWidth iconStart={it.icon} iconEnd="drag_indicator" className={styles.source}
                            onPointerDown={(e) => startDrag(e, it)}
                            onClick={() => { if (!swallowClick.current) addByPress(it); }}
                          >
                            {itemLabel(it, type)}
                          </Button>
                        ))}
                      </div>
                    </Section>
                  ))}
                </div>
              </Section>
            </div>
            )}
          </div>
        </div>
      </AppShell>

      {dragged && (
        <div className={styles.ghost} style={{ left: dragged.x, top: dragged.y }}>
          <Icon name={dragged.item.icon} size="sm" intent="brand" />{itemLabel(dragged.item, type)}
        </div>
      )}
      {dragged && overWhy && <div className={styles.why} role="status" style={{ left: dragged.x + 16, top: dragged.y + 24 }}>{overWhy}</div>}

      {editStep && (
        <Drawer
          open title={stepLabel(editStep.kind, type)} size="medium" onClose={() => setEditing(null)}
          footer={<>
            {editStep.kind !== "invoices" && <Button size="sm" emphasis="minimal" intent="danger" iconStart="delete" onClick={() => remove(editStep.id)}>Delete step</Button>}
            <Button size="sm" onClick={() => setEditing(null)}>Done</Button>
          </>}
        >
          <div className="layout-stack">
            <BlockSettings
              node={editStep} graph={graph}
              onName={(name) => setRule((r) => ({ ...r, name }), "name")}
              onPatch={(patch) => setRule((r) => patchStep(r, editStep.id, patch))}
              onBranches={(b) => setRule((r) => setModelBranches(r, editStep.id, b))}
            />
          </div>
        </Drawer>
      )}

      {checking && (
        <Drawer
          open title="Check data" size="extended" onClose={() => setChecking(false)}
          footer={<>
            <Button size="sm" onClick={() => setChecking(false)}>Back to rule</Button>
            <Button size="sm" emphasis="strong" intent="brand" iconStart="model_training" onClick={startTraining}>Start training</Button>
          </>}
        >
          <CheckData rule={rule} lead={summary.lines[0] ?? ""} matching={fullCounts.checked} type={type} />
        </Drawer>
      )}

      {detailsOpen && (
        <Drawer
          open title={DETAILS_TITLE[stage]} size="narrow" onClose={() => setDetailsFor(null)}
          footer={<Button size="sm" onClick={() => setDetailsFor(null)}>Close</Button>}
        >
          <div className="layout-stack">
            <RunPanel stage={stage} result={result} checked={fullCounts.checked} paused={paused} type={type} />
            <Section title="What this rule does" heading="sm" line="thin" spacing="tight">
              <div className={styles.summary}>
                {summary.lines.map((line, i) => <p key={line} className={i === 0 ? styles.summaryLead : undefined}>{line}</p>)}
              </div>
            </Section>
          </div>
        </Drawer>
      )}

      <AlertDialog
        open={stopping} title="Stop training?" description="It stops right away and progress so far is lost. Your rule stays as it is."
        cancelLabel="Keep training" actionLabel="Stop training" actionIntent="danger"
        onCancel={() => setStopping(false)} onAction={stopTraining}
      />

      {notes.map(({ key, ...n }) => (
        <Toast key={key} {...n} open onClose={() => setNotes((all) => all.filter((x) => x.key !== key))} />
      ))}
    </div>
  );
}

function Sequence({ seq, steps, before, ui, firstLabel }: {
  seq: string; steps: Step[]; before: BlockKind[]; ui: TreeUi; firstLabel?: string;
}) {
  const spotAt = (index: number) => ui.spotsById.get(spotId({ seq, index }));
  return (
    <>
      {steps.map((s, i) => {
        const spot = spotAt(i);
        const upstream = [...before, ...steps.slice(0, i).map((x) => x.kind)];
        return (
          <div key={s.id} className={styles.seq}>
            {spot && !ui.readOnly ? <InsertPoint spot={spot} ui={ui} label={i === 0 ? firstLabel : undefined} /> : <div className={styles.line} />}
            <Card step={s} ui={ui} before={upstream} />
            {s.paths && (
              <>
                <div className={styles.line} />
                <div className={styles.paths}>
                  {s.paths.map((p) => <PathColumn key={p.id} path={p} inModelPath={s.kind === "model"} before={[...upstream, s.kind]} ui={ui} />)}
                </div>
              </>
            )}
          </div>
        );
      })}
      {spotAt(steps.length) && !ui.readOnly && <InsertPoint spot={spotAt(steps.length)!} ui={ui} label={steps.length === 0 ? firstLabel : undefined} />}
      {spotAt(steps.length) && ui.next?.seq === seq && ui.next.index === steps.length && !ui.dragged && !ui.naming && <NextGuide spot={spotAt(steps.length)!} kind={ui.next.kind} ui={ui} />}
    </>
  );
}

function PathColumn({ path, inModelPath, before, ui }: { path: Path; inModelPath: boolean; before: BlockKind[]; ui: TreeUi }) {
  const count = ui.counts?.paths.get(path.id);
  return (
    <div className={styles.path}>
      <div className={styles.line} />
      <span className={styles.pathLabel}>{count === undefined ? path.label : `${path.label} · ${countWord(count, inModelPath ? "flag" : ui.type.one)}`}</span>
      <Sequence seq={path.id} steps={path.steps} before={before} ui={ui} />
      {path.steps.length === 0 && <span className={styles.pathEnd}>{inModelPath ? "No action" : "Not checked"}</span>}
    </div>
  );
}

// The clear next move at the end of an unfinished path, so nobody has to know the order of steps up front.
function NextGuide({ spot, kind, ui }: { spot: Spot; kind: BlockKind; ui: TreeUi }) {
  return (
    <div className={styles.guide}>
      <span className={styles.title}>{`Next: ${blockLabel(kind)}`}</span>
      <span className={styles.text}>{nextWhy(kind, ui.type)}</span>
      {ui.blank && <span className={styles.text}>Only want some {ui.type.many}? Press + above to add a Condition first.</span>}
      <Button size="sm" iconStart={iconOf(kind)} onClick={() => ui.onInsert(spot, item(kind))}>{`Add ${blockLabel(kind)}`}</Button>
    </div>
  );
}

// The start of a new rule: what it checks. One kind per rule, because the model learns what's normal for that kind.
function StartChoice({ ui }: { ui: TreeUi }) {
  return (
    <div className={styles.seq} data-naming>
      <div className={styles.choices} role="group" aria-label="What should this rule check?">
        {Object.entries(RECORDS).map(([key, r]) => (
          <button key={key} type="button" className={[styles.card, styles.cardOption].join(" ")} onClick={() => ui.onRecord(key)}>
            <span className={styles.tile}><Icon name={r.icon} size="md" /></span>
            <span className={styles.copy}>
              <span className={styles.title}>{r.label}</span>
              <span className={styles.text}>{`${r.filter} · last 12 months`}</span>
            </span>
          </button>
        ))}
      </div>
      <span className={styles.choiceNote}>One kind per rule, because the model learns what&apos;s normal for that kind. This can&apos;t change later.</span>
    </div>
  );
}

function NameGuide({ ui }: { ui: TreeUi }) {
  const [error, setError] = useState<string | undefined>();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.querySelector("input")?.focus(); }, []);
  const done = () => { if (ui.ruleName.trim()) ui.onNamed(); else setError("Give this rule a name."); };
  return (
    <div ref={box} className={styles.guide} data-naming onKeyDown={(e) => { if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") { e.preventDefault(); done(); } }}>
      <span className={styles.title}>Name this rule</span>
      <span className={styles.text}>Say what it checks, so it&apos;s easy to find in the list. You can change this later.</span>
      <div className={styles.guideField}>
        <Input label="Rule name" required value={ui.ruleName} error={error} onChange={(v) => { ui.onName(v); setError(undefined); }} />
      </div>

      <Button size="sm" onClick={done}>Continue</Button>
    </div>
  );
}

function InsertPoint({ spot, ui, label }: { spot: Spot; ui: TreeUi; label?: string }) {
  // Naming comes first, so there's no + until that's done.
  if (ui.naming) {
    return (
      <div className={styles.insert}>
        <div className={styles.line} />
        {label && <span className={styles.lineLabel}>{label}</span>}
        <div className={styles.line} />
      </div>
    );
  }
  const id = spotId(spot);
  const dragged = ui.dragged;
  const refused = dragged ? Boolean(ui.refusal(spot)) : false;
  const over = dragged?.over === id;
  const offered = ALL_ITEMS.filter((it) => (spot.inModelPath ? it.kind === "action" : it.kind !== "action"));
  return (
    <div className={styles.insert} data-spot={id}>
      <div className={styles.line} />
      {label && <span className={styles.lineLabel}>{label}</span>}
      {dragged ? (
        <div className={[styles.slot, refused ? styles.slotRefused : "", over ? (refused ? styles.slotOverRefused : styles.slotOver) : ""].join(" ")}>
          {over ? (refused ? "Can't go here" : "Drop here") : ""}
        </div>
      ) : (
        <div className={styles.plus}>
          <Dropdown
            label="Add a step here" iconOnly icon="add" size="sm"
            items={offered.map((it) => {
              const why = whyNot(it.kind, spot);
              return { id: it.id, label: itemLabel(it, ui.type), icon: it.icon, disabled: Boolean(why), description: why ?? undefined };
            })}
            onSelect={(picked) => ui.onInsert(spot, findItem(picked))}
          />
        </div>
      )}
      <div className={styles.line} />
    </div>
  );
}

function Card({ step, ui, before }: { step: Step; ui: TreeUi; before: BlockKind[] }) {
  const missing = step.kind === "model" ? (["comparePer", "values"] as BlockKind[]).filter((k) => !before.includes(k)) : [];
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ui.onCardClick(step); }
    else if ((e.key === "Delete" || e.key === "Backspace") && step.kind !== "invoices") { e.preventDefault(); ui.onRemove(step.id); }
  };
  const count = ui.counts?.steps.get(step.id);
  // While building, an open Values card lists its values as chips, so they can be changed right on the canvas.
  const chips = step.kind === "values" && !ui.readOnly && (ui.openValues === step.id || blockUnset(step));
  const picked = ui.selected === step.id || ui.openValues === step.id;
  const body = (
    <>
      <span className={styles.tile}><Icon name={step.kind === "invoices" ? ui.type.icon : iconOf(step.kind)} size="md" /></span>
      <span className={styles.copy}>
        <span className={styles.title}>{stepLabel(step.kind, ui.type)}</span>
        {!blockUnset(step) && !chips && <span className={styles.text}>{blockText(step, recordKey(ui.type))}</span>}
        {blockUnset(step) && <Badge intent="warning" size="sm" icon="warning">Fill in information</Badge>}
        {missing.map((k) => <Badge key={k} intent="warning" size="sm" icon="warning">{`Needs ${blockLabel(k)}`}</Badge>)}
        {count !== undefined && <Badge intent={step.kind === "model" ? "warning" : "neutral"} size="sm">{step.kind === "model" ? `${count.toLocaleString("en-US")} flagged` : countWord(count, ui.type.one)}</Badge>}
      </span>
    </>
  );
  if (ui.readOnly || ui.naming) return <div className={styles.cardWrap}><div data-step={step.id} className={[styles.card, styles.cardStatic].join(" ")}>{body}</div></div>;
  return (
    <div className={[styles.cardWrap, chips && picked ? styles.cardWrapPicked : ""].join(" ")}>
      <div
        data-step={step.id} role="button" tabIndex={0}
        aria-expanded={step.kind === "values" ? chips : undefined}
        aria-label={`${stepLabel(step.kind, ui.type)}: ${blockText(step, recordKey(ui.type))}. Enter ${step.kind === "values" ? "shows its values" : "opens settings"}${step.kind === "invoices" ? "" : ", Delete removes"}.`}
        className={[styles.card, chips ? styles.cardWithValues : "", ui.selected === step.id ? styles.selected : "", ui.dragged?.moving === step.id ? styles.cardMoving : ""].join(" ")}
        onPointerDown={(e) => ui.onCardDown(e, step)}
        onClick={() => ui.onCardClick(step)} onFocus={() => ui.onSelect(step.id)} onKeyDown={onKey}
      >
        {body}
      </div>
      <div className={styles.cardMenu}>
        <Dropdown
          label={`${stepLabel(step.kind, ui.type)} options`} iconOnly emphasis="minimal" size="sm" alignment="right"
          items={[
            { id: "edit", label: "Edit", icon: "edit" },
            ...(step.kind === "invoices" ? [] : [{ divider: true as const }, { id: "delete", label: "Delete", icon: "delete", danger: true }]),
          ]}
          onSelect={(id) => (id === "edit" ? ui.onOpen(step) : ui.onRemove(step.id))}
        />
      </div>
      {chips && <ValueChips step={step} ui={ui} />}
    </div>
  );
}

// Beside the card's button rather than inside it, since a button can't hold other controls.
function ValueChips({ step, ui }: { step: ValuesBlock; ui: TreeUi }) {
  const rows = step.rows.filter((r) => r.field);
  const free = ui.type.values.filter((o) => !rows.some((r) => r.field === o.value));
  const nameOf = (field: string) => ui.type.values.find((o) => o.value === field)?.label ?? field;
  const aggOf = (agg: string) => AGG_OPTIONS.find((o) => o.value === agg)?.label ?? agg;
  const change = (id: string, agg: string) => ui.onRows(step.id, step.rows.map((r) => (r.id === id ? { ...r, agg } : r)));
  return (
    <div className={styles.values} data-values>
      {rows.map((r) => (
        <div key={r.id} className={styles.valueRow}>
          <Badge removable onRemove={() => ui.onRows(step.id, step.rows.filter((x) => x.id !== r.id))}>{nameOf(r.field)}</Badge>
          <Dropdown
            label={aggOf(r.agg)} size="sm" emphasis="minimal" alignment="right"
            items={AGG_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
            onSelect={(agg) => change(r.id, agg)}
          />
        </div>
      ))}
      <Dropdown
        label="Add value" icon="add" size="sm" emphasis="minimal" disabled={!free.length}
        items={free.map((o) => ({ id: o.value, label: o.label }))}
        onSelect={(field) => ui.onRows(step.id, [...step.rows.filter((r) => r.field), { id: freshId("row"), field, agg: "sum" }])}
      />
    </div>
  );
}
