"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { AppShell } from "@/patterns/AppShell/AppShell";
import { APP_NAV, APP_NAV_END } from "@/patterns/AppShell/appNav";
import { AppHeader } from "@/ui/AppHeader/AppHeader";
import { AppNav } from "@/ui/AppNav/AppNav";
import { Button } from "@/ui/Button/Button";
import { ButtonGroup } from "@/ui/ButtonGroup/ButtonGroup";
import { Callout } from "@/ui/Callout/Callout";
import { Drawer } from "@/ui/Drawer/Drawer";
import { Dropdown } from "@/ui/Dropdown/Dropdown";
import { EmptyState } from "@/ui/EmptyState/EmptyState";
import { Form } from "@/ui/Form/Form";
import { FormDisplay } from "@/ui/FormDisplay/FormDisplay";
import { Icon } from "@/ui/Icon/Icon";
import { PageHeader } from "@/ui/PageHeader/PageHeader";
import { Section } from "@/ui/Section/Section";
import { Select } from "@/ui/Select/Select";
import { Toast, type ToastProps } from "@/ui/Toast/Toast";
import {
  BLOCKS,
  blockLabel, blockText, blockUnset, checklist, followers, freshId, newBlock, openSteps, outputs, refusal, seedGraph, summarize,
  type Block, type BlockKind, type Graph,
} from "./graph";
import { BlockSettings } from "./BlockSettings";
import styles from "./page.module.css";

// Settings › Anomaly detection, set up by dragging blocks and connecting them. Local state only.

const NODE_WIDTH = 160;
const HEAD_HEIGHT = 32;
const BODY_HEIGHT = 40;
const ROW_HEIGHT = 24;
const NODE_PAD = 4;
const PORT_RADIUS = 6;
const PLANE_PAD = 240;
const DRAG_START = 4;
const STEP = 20;
const FINE_STEP = 4;
const GRID = 4;
const NODE_GAP = 28;
const SUGGEST_GAP = 32;
const HISTORY_LIMIT = 50;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;
const FIT_MARGIN = 20;

type Note = Omit<ToastProps, "open" | "onClose"> & { key: number };
interface Point { x: number; y: number }
interface Pending { from: string; port: string; at: Point; client: Point; over: string | null }
// key groups a run of small changes, like one drag or one typed name, into a single undo.
interface History { past: Graph[]; present: Graph; future: Graph[]; key: string | null }

const stepBack = (h: History): History =>
  h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future], key: null } : h;
const stepForward = (h: History): History =>
  h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1), key: null } : h;

const nodeHeight = (n: Block) => HEAD_HEIGHT + BODY_HEIGHT + outputs(n).length * ROW_HEIGHT + NODE_PAD;
const portY = (i: number) => HEAD_HEIGHT + BODY_HEIGHT + (i + 0.5) * ROW_HEIGHT;
const outPoint = (n: Block, port: string): Point => ({ x: n.x + NODE_WIDTH, y: n.y + portY(outputs(n).findIndex((p) => p.id === port)) });
// The way in sits level with the first way out, so a straight run of blocks draws straight lines.
const inY = (n: Block) => (outputs(n).length ? portY(0) : nodeHeight(n) / 2);
const inPoint = (n: Block): Point => ({ x: n.x - PORT_RADIUS, y: n.y + inY(n) });
const curve = (a: Point, b: Point) => {
  const bend = Math.max(Math.abs(b.x - a.x) / 2, 24);
  return `M ${a.x} ${a.y} C ${a.x + bend} ${a.y}, ${b.x - bend} ${b.y}, ${b.x} ${b.y}`;
};
const snap = (v: number) => Math.max(0, Math.round(v / GRID) * GRID);

// Follow the pointer until it lets go, wherever it goes.
function follow(onMove: (e: PointerEvent) => void, onEnd: (e: PointerEvent | null) => void) {
  const stop = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", cancel);
  };
  const up = (e: PointerEvent) => { stop(); onEnd(e); };
  const cancel = () => { stop(); onEnd(null); };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", cancel);
}

export default function AnomalyNodesPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [history, setHistory] = useState<History>(() => ({ past: [], present: seedGraph(), future: [], key: null }));
  const graph = history.present;
  const [zoom, setZoom] = useState(1);
  const [dropMenu, setDropMenu] = useState<{ from: string; port: string; at: Point } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [ghost, setGhost] = useState<{ kind: BlockKind; x: number; y: number } | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const plane = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const scrollAfterZoom = useRef<Point | null>(null);
  const focusNext = useRef<string | null>(null);
  const noteKey = useRef(0);
  const swallowClick = useRef(false);
  const viewBeforeEdit = useRef<Point | null>(null);

  // One at a time: a run of refused connections shouldn't pile up over the canvas.
  const notify = (n: Omit<Note, "key">) => setNotes([{ ...n, key: ++noteKey.current }]);
  const refuse = (description: string) => notify({ intent: "warning", title: "Can't connect these", description });
  const notHere = () => notify({ intent: "info", title: "Not available from this screen" });

  const setGraph = (update: (g: Graph) => Graph, key?: string) =>
    setHistory((h) => {
      const next = update(h.present);
      if (next === h.present) return h;
      const sameRun = key !== undefined && h.key === key;
      return { past: sameRun ? h.past : [...h.past, h.present].slice(-HISTORY_LIMIT), present: next, future: [], key: key ?? null };
    });
  const undo = () => setHistory(stepBack);
  const redo = () => setHistory(stepForward);

  const nodeEl = (id: string) => plane.current?.querySelector<HTMLElement>(`[data-node="${id}"]`) ?? null;
  // The plane is scaled, so its box is on screen size and a pointer's distance across it divides back down.
  const toPlane = (clientX: number, clientY: number): Point => {
    const box = plane.current!.getBoundingClientRect();
    return { x: (clientX - box.left) / zoom, y: (clientY - box.top) / zoom };
  };

  // Undo and redo from the keyboard, except where the key means undo in a text field.
  useEffect(() => {
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
  }, []);

  // A new zoom changes how far the canvas can scroll, so its scroll position waits for the new size to be on the page.
  useLayoutEffect(() => {
    if (scrollAfterZoom.current) {
      canvas.current?.scrollTo(scrollAfterZoom.current.x, scrollAfterZoom.current.y);
      scrollAfterZoom.current = null;
    }
  }, [zoom]);
  // Zoom around the middle of what's in view.
  const zoomTo = (value: number) => {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 10) / 10));
    const box = canvas.current;
    if (!box || next === zoom) return;
    scrollAfterZoom.current = {
      x: ((box.scrollLeft + box.clientWidth / 2) / zoom) * next - box.clientWidth / 2,
      y: ((box.scrollTop + box.clientHeight / 2) / zoom) * next - box.clientHeight / 2,
    };
    setZoom(next);
  };
  const fit = () => {
    const box = canvas.current;
    if (!box || !graph.nodes.length) return;
    const left = Math.min(...graph.nodes.map((n) => n.x));
    const top = Math.min(...graph.nodes.map((n) => n.y));
    const width = Math.max(...graph.nodes.map((n) => n.x + NODE_WIDTH)) - left;
    const height = Math.max(...graph.nodes.map((n) => n.y + nodeHeight(n))) - top;
    const room = Math.min((box.clientWidth - FIT_MARGIN * 2) / width, (box.clientHeight - FIT_MARGIN * 2) / height);
    const next = Math.min(1, Math.max(ZOOM_MIN, Math.floor(room * 10) / 10));
    const spot = { x: left * next - FIT_MARGIN, y: top * next - FIT_MARGIN };
    if (next === zoom) box.scrollTo(spot.x, spot.y);
    else { scrollAfterZoom.current = spot; setZoom(next); }
  };

  // Focus a block once it is on the page: a new one, or the next one along after a delete.
  useEffect(() => {
    if (focusNext.current) { nodeEl(focusNext.current)?.focus(); focusNext.current = null; }
  }, [graph]);
  // The page makes room for the Drawer, so bring the block being edited into what's left, and put the view back after.
  useEffect(() => {
    const box = canvas.current;
    if (!box) return;
    if (editing) {
      viewBeforeEdit.current ??= { x: box.scrollLeft, y: box.scrollTop };
      nodeEl(editing)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    } else if (viewBeforeEdit.current) {
      box.scrollTo(viewBeforeEdit.current.x, viewBeforeEdit.current.y);
      viewBeforeEdit.current = null;
    }
  }, [editing]);

  const summary = useMemo(() => summarize(graph), [graph]);
  const needs = useMemo(() => checklist(graph), [graph]);
  const steps = useMemo(() => openSteps(graph, selected), [graph, selected]);
  const planeSize = useMemo(() => ({
    width: Math.max(0, ...graph.nodes.map((n) => n.x + NODE_WIDTH + PLANE_PAD)),
    height: Math.max(0, ...graph.nodes.map((n) => n.y + nodeHeight(n) + PLANE_PAD)),
  }), [graph.nodes]);
  const editNode = graph.nodes.find((n) => n.id === editing);

  const patchNode = (id: string, patch: Partial<Block>, key?: string) =>
    setGraph((g) => ({ ...g, nodes: g.nodes.map((n) => (n.id === id ? ({ ...n, ...patch } as Block) : n)) }), key);
  const moveNode = (id: string, x: number, y: number, key: string) => patchNode(id, { x: snap(x), y: snap(y) }, key);

  // A new block on the end of an output: at the drop point, or just past its source and clear of other blocks.
  const addAfter = (from: Block, port: string, kind: BlockKind, at?: Point) => {
    const block = newBlock(kind, 0, 0);
    const start = outPoint(from, port);
    const x = at ? at.x : start.x + NODE_GAP;
    let y = (at ? at.y : start.y) - inY(block);
    const blocked = (top: number) => graph.nodes.some((n) => n.x < x + NODE_WIDTH && n.x + NODE_WIDTH > x && n.y < top + nodeHeight(block) && n.y + nodeHeight(n) > top);
    if (!at) while (blocked(y)) y += STEP;
    const placed = { ...block, x: snap(x), y: snap(y) };
    focusNext.current = placed.id;
    setGraph((g) => ({ ...g, nodes: [...g.nodes, placed], links: [...g.links, { id: freshId("link"), from: from.id, port, to: placed.id }] }));
    setSelected(placed.id);
    setSelectedLink(null);
  };

  const addBlock = (kind: BlockKind, at?: Point) => {
    if (kind === "invoices" && graph.nodes.some((n) => n.kind === "invoices")) {
      notify({ intent: "warning", title: "This rule already has Invoices", description: "A rule starts from one Invoices block." });
      return;
    }
    // From the keyboard there is no drop point, so a new block steps clear of the ones already there.
    let spot = at;
    if (!spot) {
      let step = 0;
      const taken = (x: number, y: number) => graph.nodes.some((n) => n.x === x && n.y === y);
      while (taken(STEP + step * STEP * 2, STEP + step * STEP * 2)) step++;
      spot = { x: STEP + step * STEP * 2, y: STEP + step * STEP * 2 };
    }
    const block = newBlock(kind, snap(spot.x), snap(spot.y));
    focusNext.current = block.id;
    setGraph((g) => ({ ...g, nodes: [...g.nodes, block] }));
    setSelected(block.id);
    setSelectedLink(null);
  };

  const removeNode = (id: string) => {
    const others = graph.nodes.filter((n) => n.id !== id);
    focusNext.current = others[Math.min(graph.nodes.findIndex((n) => n.id === id), others.length - 1)]?.id ?? null;
    setGraph((g) => ({ ...g, nodes: g.nodes.filter((n) => n.id !== id), links: g.links.filter((l) => l.from !== id && l.to !== id) }));
    setSelected(null);
    setEditing(null);
    notify({ intent: "info", title: "Block deleted", actionLabel: "Undo", onAction: undo });
  };
  const removeLink = (id: string) => {
    setGraph((g) => ({ ...g, links: g.links.filter((l) => l.id !== id) }));
    setSelectedLink(null);
  };
  const reset = () => {
    setGraph(() => seedGraph());
    // The example starts at its own view too, so none of it is left scrolled out of sight.
    if (zoom === 1) canvas.current?.scrollTo(0, 0);
    else { scrollAfterZoom.current = { x: 0, y: 0 }; setZoom(1); }
    setSelected(null);
    setSelectedLink(null);
    setEditing(null);
    notify({ intent: "success", title: "Back to the example rule", actionLabel: "Undo", onAction: undo });
  };

  // One Goes to field in the Drawer: swap whatever this output pointed at for the new block, or for nothing.
  const setTarget = (from: string, port: string, to: string) =>
    setGraph((g) => ({
      ...g,
      links: [...g.links.filter((l) => !(l.from === from && l.port === port)), ...(to ? [{ id: freshId("link"), from, port, to }] : [])],
    }));
  const setBranches = (node: Block, branches: string[]) => {
    setGraph((g) => ({
      ...g,
      nodes: g.nodes.map((n) => (n.id === node.id ? ({ ...n, branches } as Block) : n)),
      // A type that is no longer split out takes its output, and that output's line, with it.
      links: g.links.filter((l) => l.from !== node.id || l.port === "otherwise" || branches.includes(l.port)),
    }));
  };

  const startNodeDrag = (e: ReactPointerEvent<HTMLDivElement>, n: Block) => {
    if (e.button !== 0) return;
    const start = { x: e.clientX, y: e.clientY };
    const dragKey = `drag:${n.id}:${e.timeStamp}`;
    let moved = false;
    setSelected(n.id);
    setSelectedLink(null);
    follow(
      (ev) => {
        if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < DRAG_START) return;
        if (!moved) { moved = true; setDragging(n.id); }
        moveNode(n.id, n.x + (ev.clientX - start.x) / zoom, n.y + (ev.clientY - start.y) / zoom, dragKey);
      },
      (ev) => {
        setDragging(null);
        if (ev && !moved) setEditing(n.id);
      },
    );
  };

  const startConnect = (e: ReactPointerEvent<HTMLSpanElement>, n: Block, port: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const overNode = (x: number, y: number) => document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-node]")?.dataset.node ?? null;
    const at = (ev: { clientX: number; clientY: number }) => ({
      at: toPlane(ev.clientX, ev.clientY), client: { x: ev.clientX, y: ev.clientY }, over: overNode(ev.clientX, ev.clientY),
    });
    setSelectedLink(null);
    setPending({ from: n.id, port, ...at(e) });
    follow(
      (ev) => setPending({ from: n.id, port, ...at(ev) }),
      (ev) => {
        setPending(null);
        if (!ev) return;
        const to = overNode(ev.clientX, ev.clientY);
        // Letting go on empty canvas offers a new block for the line's end, if this output is free.
        if (!to) {
          const under = document.elementFromPoint(ev.clientX, ev.clientY);
          const free = !graph.links.some((l) => l.from === n.id && l.port === port);
          if (free && under && canvas.current?.contains(under)) setDropMenu({ from: n.id, port, at: toPlane(ev.clientX, ev.clientY) });
          return;
        }
        // Letting go back on its own block is changing your mind, not a refused connection.
        if (to === n.id) return;
        const why = refusal(graph, n.id, port, to);
        if (why) { refuse(why); return; }
        setTarget(n.id, port, to);
      },
    );
  };

  const startPaletteDrag = (e: ReactPointerEvent<HTMLButtonElement>, kind: BlockKind) => {
    if (e.button !== 0) return;
    const start = { x: e.clientX, y: e.clientY };
    let moved = false;
    follow(
      (ev) => {
        if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < DRAG_START) return;
        moved = true;
        setGhost({ kind, x: ev.clientX, y: ev.clientY });
      },
      (ev) => {
        setGhost(null);
        if (!moved) return;
        swallowClick.current = true;
        // A release back on the palette still fires a click; the next tick clears the flag if none came.
        setTimeout(() => { swallowClick.current = false; }, 0);
        if (!ev || !canvas.current) return;
        const box = canvas.current.getBoundingClientRect();
        if (ev.clientX < box.left || ev.clientX > box.right || ev.clientY < box.top || ev.clientY > box.bottom) return;
        const p = toPlane(ev.clientX, ev.clientY);
        addBlock(kind, { x: p.x - NODE_WIDTH / 2, y: p.y - HEAD_HEIGHT });
      },
    );
  };

  const nodeKeys = (e: KeyboardEvent<HTMLDivElement>, n: Block) => {
    if (e.target !== e.currentTarget) return;
    const step = e.shiftKey ? FINE_STEP : STEP;
    const arrows: Record<string, Point> = { ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 }, ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step } };
    if (arrows[e.key]) {
      e.preventDefault();
      moveNode(n.id, n.x + arrows[e.key].x, n.y + arrows[e.key].y, `keys:${n.id}`);
      const el = e.currentTarget;
      requestAnimationFrame(() => el.scrollIntoView({ block: "nearest", inline: "nearest" }));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelected(n.id);
      setEditing(n.id);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      removeNode(n.id);
    }
  };

  const overRefusal = pending && pending.over && pending.over !== pending.from ? refusal(graph, pending.from, pending.port, pending.over) : null;
  const shownLink = graph.links.find((l) => l.id === selectedLink);
  const dropSource = dropMenu && graph.nodes.find((n) => n.id === dropMenu.from);
  const showSteps = !pending && !dragging && !ghost && !dropMenu && !editNode;

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
            title={graph.name || "Untitled rule"}
            breadcrumbs={[{ label: "Home", href: "#" }, { label: "Settings", href: "#" }, { label: "Anomaly detection", href: "/anomaly-detection" }]}
            actions={<>
              <Button size="sm" iconOnly iconStart="undo" disabled={!history.past.length} onClick={undo}>Undo</Button>
              <Button size="sm" iconOnly iconStart="redo" disabled={!history.future.length} onClick={redo}>Redo</Button>
              <Button size="sm" iconStart="restart_alt" onClick={reset}>Reset example</Button>
            </>}
          />
        }
      >
        <Callout intent="info" closeButton>
          This is an example rule. Branching by anomaly type and acting on a flag are ideas to react to, not something the review agreed.
        </Callout>

        <div className={[styles.workspace, editNode ? styles.withDrawer : ""].join(" ")}>
          <div className={styles.palette}>
            <Section
              title="Blocks" heading="sm" line="thin" spacing="tight"
              help="Drag a block onto the canvas, or press it to add one. Drag from a dot on a block's right edge to another block to connect them, or let go on empty canvas to pick a new block. Select a block to edit it. Arrow keys move a selected block, Enter opens it and Delete removes it."
            >
              {BLOCKS.map((b) => (
                <Button
                  key={b.kind} size="sm" fullWidth iconStart={b.icon} className={styles.source}
                  onPointerDown={(e) => startPaletteDrag(e, b.kind)}
                  onClick={() => { if (!swallowClick.current) addBlock(b.kind); }}
                >
                  {b.label}
                </Button>
              ))}
            </Section>
            <Section title="Every rule needs" heading="sm" line="thin" spacing="tight">
              <div className={styles.needs}>
                {needs.map((n) => (
                  <div key={n.kind} className={styles.need}>
                    <Icon name={n.done ? "check_circle" : "radio_button_unchecked"} size="sm" intent={n.done ? "success" : "subtle"} label={n.done ? "Done" : "Still needed"} />
                    {blockLabel(n.kind)}
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <Section title="What this rule does" heading="sm" line="thin" spacing="tight">
            <div className={styles.summary} role="status">
              {summary.lines.map((line, i) => <p key={line} className={i === 0 ? styles.summaryLead : undefined}>{line}</p>)}
              {summary.problems.map((p) => (
                <p key={p} className={styles.problem}><Icon name="warning" size="sm" intent="warning" />{p}</p>
              ))}
            </div>
          </Section>

          <div className={styles.canvasArea}>
            {graph.nodes.length === 0 && (
              <div className={styles.empty}>
                <EmptyState icon="account_tree" iconStyle="plain" title="Nothing on the canvas" description="Drag Invoices here to start a rule." />
              </div>
            )}
            <div className={styles.tools}>
              <ButtonGroup label="Canvas zoom" size="sm">
                <Button iconOnly iconStart="remove" disabled={zoom <= ZOOM_MIN} onClick={() => zoomTo(zoom - ZOOM_STEP)}>Zoom out</Button>
                <Button onClick={() => zoomTo(1)}>{`${Math.round(zoom * 100)}%`}</Button>
                <Button iconOnly iconStart="add" disabled={zoom >= ZOOM_MAX} onClick={() => zoomTo(zoom + ZOOM_STEP)}>Zoom in</Button>
                <Button iconStart="fit_screen" disabled={!graph.nodes.length} onClick={fit}>Fit</Button>
              </ButtonGroup>
            </div>
            <div
              ref={canvas} className={styles.canvas} style={{ "--canvas-zoom": zoom } as CSSProperties}
              onPointerDown={(e) => {
                if (!(e.target as Element).closest("[data-node], button, path")) { setSelected(null); setSelectedLink(null); }
              }}
            >
            <div className={styles.sizer} style={{ width: planeSize.width * zoom, height: planeSize.height * zoom }}>
            <div
              ref={plane} className={styles.plane} role="group" aria-label="Rule canvas"
              style={{ width: planeSize.width, height: planeSize.height, transform: `scale(${zoom})` }}
            >
              <svg className={styles.lines} width={planeSize.width} height={planeSize.height} aria-hidden={graph.links.length === 0 && !pending}>
                <defs>
                  <marker id="line-end" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" className={styles.arrow} /></marker>
                  <marker id="line-end-on" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" className={styles.arrowOn} /></marker>
                </defs>
                {graph.links.map((l) => {
                  const from = graph.nodes.find((n) => n.id === l.from)!;
                  const to = graph.nodes.find((n) => n.id === l.to)!;
                  const d = curve(outPoint(from, l.port), inPoint(to));
                  const port = outputs(from).find((p) => p.id === l.port)!;
                  const on = l.id === selectedLink;
                  return (
                    <g key={l.id}>
                      <path
                        d={d} className={styles.hit} role="button" tabIndex={0}
                        aria-label={`Connection from ${blockLabel(from.kind)}, ${port.label}, to ${blockLabel(to.kind)}. Press Delete to remove.`}
                        onClick={() => { setSelectedLink(l.id); setSelected(null); }}
                        onFocus={() => { setSelectedLink(l.id); setSelected(null); }}
                        onKeyDown={(e) => {
                          if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); removeLink(l.id); }
                        }}
                      />
                      <path d={d} className={[styles.line, on ? styles.lineOn : ""].join(" ")} markerEnd={`url(#${on ? "line-end-on" : "line-end"})`} />
                    </g>
                  );
                })}
                {pending && (
                  <path d={curve(outPoint(graph.nodes.find((n) => n.id === pending.from)!, pending.port), pending.at)} className={styles.pendingLine} />
                )}
                {dropMenu && dropSource && <path d={curve(outPoint(dropSource, dropMenu.port), dropMenu.at)} className={styles.pendingLine} />}
                {showSteps && steps.map(({ node, port }) => {
                  const a = outPoint(node, port);
                  return <path key={`${node.id}:${port}`} d={`M ${a.x} ${a.y} H ${a.x + NODE_GAP}`} className={styles.suggestLine} />;
                })}
              </svg>

              {graph.nodes.map((n) => {
                const canTake = pending && n.id !== pending.from ? !refusal(graph, pending.from, pending.port, n.id) : null;
                const blockIcon = BLOCKS.find((b) => b.kind === n.kind)!.icon;
                const ports = outputs(n);
                return (
                  <div
                    key={n.id} data-node={n.id} role="button" tabIndex={0}
                    aria-label={`${blockLabel(n.kind)}: ${blockText(n)}. Arrow keys move, Enter opens settings, Delete removes.`}
                    className={[
                      styles.node,
                      selected === n.id ? styles.selected : "",
                      dragging === n.id ? styles.dragging : "",
                      canTake === true ? styles.canDrop : "",
                      canTake === false ? styles.cannotDrop : "",
                      canTake === false && pending?.over === n.id ? styles.overRefused : "",
                    ].join(" ")}
                    style={{ left: n.x, top: n.y, width: NODE_WIDTH, height: nodeHeight(n) } as CSSProperties}
                    onPointerDown={(e) => startNodeDrag(e, n)}
                    onFocus={() => { setSelected(n.id); setSelectedLink(null); }}
                    onKeyDown={(e) => nodeKeys(e, n)}
                  >
                    <div className={styles.nodeHead} style={{ height: HEAD_HEIGHT }}>
                      <Icon name={blockIcon} size="sm" intent="brand" />{blockLabel(n.kind)}
                    </div>
                    <div className={[styles.nodeBody, blockUnset(n) ? styles.unset : ""].join(" ")} style={{ height: BODY_HEIGHT }}>{blockText(n)}</div>
                    {ports.map((p) => <div key={p.id} className={styles.outputRow} style={{ height: ROW_HEIGHT }}>{p.id === "out" ? "" : p.label}</div>)}

                    {n.kind !== "invoices" && <span className={styles.port} style={{ left: 0, top: inY(n) }} />}
                    {ports.map((p, i) => {
                      const linked = graph.links.some((l) => l.from === n.id && l.port === p.id);
                      const on = pending?.from === n.id && pending.port === p.id;
                      return (
                        <span
                          key={p.id} data-port={p.id}
                          className={[styles.port, styles.portOut, linked ? styles.portLinked : "", on ? styles.portOn : ""].join(" ")}
                          style={{ left: "100%", top: portY(i) }}
                          onPointerDown={(e) => startConnect(e, n, p.id)}
                        />
                      );
                    })}
                  </div>
                );
              })}

              {shownLink && (() => {
                const a = outPoint(graph.nodes.find((n) => n.id === shownLink.from)!, shownLink.port);
                const b = inPoint(graph.nodes.find((n) => n.id === shownLink.to)!);
                return (
                  <div className={styles.removeLine} style={{ left: (a.x + b.x) / 2, top: (a.y + b.y) / 2 }}>
                    <Button size="sm" iconOnly iconStart="close" onClick={() => removeLink(shownLink.id)}>Remove connection</Button>
                  </div>
                );
              })()}

              {showSteps && steps.flatMap(({ node, port, kinds }) => {
                const a = outPoint(node, port);
                return kinds.map((kind, i) => (
                  <div
                    key={`${node.id}:${port}:${kind}`} className={styles.suggest}
                    style={{ left: a.x + NODE_GAP, top: a.y + (i - (kinds.length - 1) / 2) * SUGGEST_GAP }}
                  >
                    <Button size="sm" iconStart="add" onClick={() => addAfter(node, port, kind)}>{`Add ${blockLabel(kind)}`}</Button>
                  </div>
                ));
              })}

              {dropMenu && dropSource && (
                <div className={styles.dropMenu} style={{ left: dropMenu.at.x, top: dropMenu.at.y }}>
                  <Dropdown
                    label="Add a block here" iconOnly icon="add" size="sm" open
                    onOpenChange={(open) => { if (!open) setDropMenu(null); }}
                    items={followers(dropSource).map((kind) => ({ id: kind, label: blockLabel(kind), icon: BLOCKS.find((b) => b.kind === kind)!.icon }))}
                    onSelect={(kind) => { addAfter(dropSource, dropMenu.port, kind as BlockKind, dropMenu.at); setDropMenu(null); }}
                  />
                </div>
              )}
            </div>
            </div>
            </div>
          </div>
        </div>
      </AppShell>

      {ghost && (
        <div className={[styles.node, styles.ghost].join(" ")} style={{ left: ghost.x, top: ghost.y, width: NODE_WIDTH }}>
          <div className={styles.nodeHead} style={{ height: HEAD_HEIGHT }}>
            <Icon name={BLOCKS.find((b) => b.kind === ghost.kind)!.icon} size="sm" intent="brand" />{blockLabel(ghost.kind)}
          </div>
        </div>
      )}
      {pending && overRefusal && <div className={styles.why} role="status" style={{ left: pending.client.x + 16, top: pending.client.y + 16 }}>{overRefusal}</div>}

      {editNode && (
        <Drawer
          open title={blockLabel(editNode.kind)} size="medium" onClose={() => setEditing(null)}
          footer={<>
            <Button size="sm" emphasis="minimal" intent="danger" iconStart="delete" onClick={() => removeNode(editNode.id)}>Delete block</Button>
            <Button size="sm" onClick={() => setEditing(null)}>Done</Button>
          </>}
        >
          <div className="layout-stack">
            <BlockSettings node={editNode} graph={graph} onName={(name) => setGraph((g) => ({ ...g, name }), "name")}onPatch={(patch) => patchNode(editNode.id, patch)} onBranches={(b) => setBranches(editNode, b)} />
            <Connections node={editNode} graph={graph} onTarget={setTarget} />
          </div>
        </Drawer>
      )}

      {notes.map(({ key, ...n }) => (
        <Toast key={key} {...n} open onClose={() => setNotes((all) => all.filter((x) => x.key !== key))} />
      ))}
    </div>
  );
}

// Making and changing connections without dragging. Only blocks this output can really connect to are offered.
function Connections({ node, graph, onTarget }: { node: Block; graph: Graph; onTarget: (from: string, port: string, to: string) => void }) {
  const ports = outputs(node);
  const incoming = graph.links.filter((l) => l.to === node.id);
  return (
    <>
      {ports.length > 0 && (
        <Section title="Goes to" heading="sm" line="thin">
          <Form labelPosition="start">
            {ports.map((p) => {
              const current = graph.links.find((l) => l.from === node.id && l.port === p.id);
              const without = { ...graph, links: graph.links.filter((l) => l !== current) };
              const targets = graph.nodes.filter((n) => !refusal(without, node.id, p.id, n.id));
              return (
                <Select
                  key={p.id} label={p.id === "out" ? "Next block" : p.label} placeholder="Nothing" value={current?.to ?? ""}
                  options={[{ value: "", label: "Nothing" }, ...targets.map((n) => ({ value: n.id, label: `${blockLabel(n.kind)}: ${blockText(n)}` }))]}
                  onChange={(v) => onTarget(node.id, p.id, v as string)}
                />
              );
            })}
          </Form>
        </Section>
      )}
      {incoming.length > 0 && (
        <Section title="Comes from" heading="sm" line="thin">
          <Form labelPosition="start">
            <div>
              {incoming.map((l) => {
                const from = graph.nodes.find((n) => n.id === l.from)!;
                const port = outputs(from).find((p) => p.id === l.port)!;
                return <FormDisplay key={l.id} label={blockLabel(from.kind)} value={port.id === "out" ? blockText(from) : `${blockText(from)} · ${port.label}`} />;
              })}
            </div>
          </Form>
        </Section>
      )}
    </>
  );
}
