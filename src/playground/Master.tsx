"use client";
import { useState, type CSSProperties } from "react";
import { Button } from "@/ui/Button/Button";
import { Switch } from "@/ui/Switch/Switch";
import { Tabs } from "@/ui/Tabs/Tabs";
import styles from "./master.module.css";
import { registry, type Props } from "./registry";
import { useCopy, type Copy } from "./useCopy";

type PropDef = { type?: string; enum?: (string | number)[]; default?: unknown; note?: string; required?: boolean };
export interface Example {
  title: string;
  usage?: string;
  a11y?: boolean;
  items: { caption?: string; props: Props }[];
}
export interface Contract {
  name: string; path: string; intent: string; usage?: string;
  props: Record<string, PropDef>;
  useWhen: string[]; doNot: string[]; a11y: string[]; snippet: string;
  examples?: Example[];
}

const sizeOrder = ["xs", "sm", "md", "lg", "xl", "full"];
const order = (vals: (string | number)[]) => [...vals].map(String).sort((a, b) => (sizeOrder.includes(a) && sizeOrder.includes(b) ? sizeOrder.indexOf(a) - sizeOrder.indexOf(b) : 0));
const words = (k: string) => k.replace(/([A-Z])/g, " $1").toLowerCase();
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

// Object literal for code samples: { id: "a", title: "A" }. Nested objects and arrays print the same way.
const lit = (v: unknown): string =>
  Array.isArray(v) ? `[${v.map(lit).join(", ")}]`
  : v && typeof v === "object" ? `{ ${Object.entries(v).map(([k, x]) => `${k}: ${lit(x)}`).join(", ")} }`
  : JSON.stringify(v);
// Arrays of objects print one item per line so code samples stay readable.
// Single objects print as { name: "Maya Chen" }, not JSON.
const fmt = (v: unknown, pad: string) =>
  Array.isArray(v) && v.some((x) => x && typeof x === "object") ? `[\n${v.map((x) => `${pad}  ${lit(x)},`).join("\n")}\n${pad}]` : lit(v);

// Writes props as JSX in contract prop order. Multiline matches the Preview snippet.
// Array children are child kit components (e.g. Buttons in a ButtonGroup), one per line.
function toJsx(name: string, p: Props, keys: string[], multiline = false, childName = ""): string {
  const all = [...keys, ...Object.keys(p).filter((k) => !keys.includes(k))];
  const attrs = all
    .filter((k) => k !== "children" && p[k] !== undefined && p[k] !== false && p[k] !== "")
    .map((k) => (p[k] === true ? k : typeof p[k] === "string" ? (/^\{.*\}$/.test(p[k] as string) ? `${k}=${p[k]}` : `${k}="${p[k]}"`) : `${k}={${fmt(p[k], multiline ? "  " : "")}}`));
  if (Array.isArray(p.children)) {
    const inner = (p.children as Props[]).map((child) => `  ${toJsx(childName, child, [])}`).join("\n");
    return `<${[name, ...attrs].join(" ")}>\n${inner}\n</${name}>`;
  }
  const kids = p.children as string | undefined;
  if (!multiline) {
    const open = [name, ...attrs].join(" ");
    return kids ? `<${open}>${kids}</${name}>` : `<${open} />`;
  }
  const open = `<${name}\n${attrs.map((a) => `  ${a}`).join("\n")}\n`;
  return kids ? `${open}>\n  ${kids}\n</${name}>` : `${open}/>`;
}

function Code({ code, id, c }: { code: string; id: string; c: Copy }) {
  const done = c.copied === id;
  return (
    <div className={styles.codeWrap}>
      <pre className={styles.code}>{code}</pre>
      <span className={styles.copy}>
        <Button size="sm" variant="secondary" iconStart={done ? "check" : "content_copy"} onClick={() => c.copy(id, code)}>
          {done ? "Copied" : "Copy"}
        </Button>
      </span>
    </div>
  );
}

export function Master({ contract }: { contract: Contract }) {
  const entry = registry[contract.name];
  const c = useCopy();
  const [tab, setTab] = useState<"preview" | "variants">("preview");
  const [state, setState] = useState<Props>(() => {
    const d: Props = {};
    for (const [k, v] of Object.entries(contract.props)) if (v.default !== undefined) d[k] = v.default;
    for (const [k, v] of Object.entries(entry?.extras ?? {})) d[k] = v.default;
    for (const [k, v] of Object.entries(entry?.toggles ?? {})) d[k] = v.default;
    return { ...d, ...entry?.preview };
  });
  const set = (k: string, v: unknown) => setState((s) => ({ ...s, [k]: v }));

  if (!entry) return <p className={styles.hint}>No playground entry registered for {contract.name}.</p>;

  const keys = Object.keys(contract.props);
  const childType = contract.props.children?.type ?? "";
  const childName = childType.endsWith("[]") ? childType.slice(0, -2) : "";
  const skip = new Set(["children", ...(entry.hide ?? [])]);
  const enums = Object.entries(contract.props).filter(([k, v]) => v.enum && !skip.has(k)).sort(([a], [b]) => Number(b === "size") - Number(a === "size"))
    .concat(Object.entries(entry.extras ?? {}).map(([k, v]) => [k, { enum: v.values }]));
  const bools = Object.entries(contract.props).filter(([k, v]) => v.type === "boolean" && !skip.has(k) && !entry.toggles?.[k]);
  const toggles = Object.entries(entry.toggles ?? {});
  const shown = entry.normalize ? entry.normalize(state) : state;

  // Enums always show; strings and numbers show unless they equal the contract default.
  const codeProps = (p: Props) => {
    const src = { ...entry.snippet, ...p };
    const out: Props = {};
    for (const k of [...keys, ...Object.keys(src).filter((x) => !keys.includes(x))]) {
      const v = src[k], def = contract.props[k];
      // Hidden props stay out of code unless the entry supplies a code-only value (e.g. open={open}).
      if (v === undefined || entry.extras?.[k] || (entry.toggles?.[k] && !contract.props[k]) || (entry.hide?.includes(k) && entry.snippet?.[k] === undefined)) continue;
      if (def?.enum || v === true || (typeof v === "number" && v !== def?.default) || Array.isArray(v) || (typeof v === "string" && v && v !== def?.default)) out[k] = v;
    }
    return out;
  };
  const snippetProps = codeProps(shown);
  const snippet = toJsx(contract.name, snippetProps, keys, true, childName);
  const hasControls = enums.length + bools.length + toggles.length > 0;
  const hint = entry.hint ?? (!hasControls ? contract.intent : `Toggle ${list([...enums, ...bools].map(([k]) => words(k)))} to preview every ${contract.name} combination.`);
  const file = `contracts/${contract.name.toLowerCase()}.json`;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.h2}>Master</h2>
        <p className={styles.lead}>{hint}</p>
        {/* The real kit Tabs, as a strip: the Master shows the chosen view below. */}
        <div className={styles.viewTabs}>
          <Tabs
            label={`${contract.name} views`} value={tab} onChange={(id) => setTab(id as "preview" | "variants")}
            items={[{ id: "preview", label: "Preview" }, { id: "variants", label: "Variants" }]}
          />
        </div>
      </div>

      {tab === "preview" ? (
        <div className={styles.section}>
          <div className={styles.layout} style={entry.panelWidth ? ({ "--panel-w": `${entry.panelWidth}px` } as CSSProperties) : undefined}>
            <div className={[styles.canvas, hasControls ? "" : styles.canvasFull].join(" ")}>{entry.block ? <div className={[styles.block, entry.wide ? styles.wide : ""].join(" ")}>{entry.render(shown)}</div> : entry.render(shown)}</div>
            {hasControls && (<aside className={styles.panel} aria-label={`${contract.name} controls`}>
              {enums.map(([k, v]) => {
                const id = `ctl-${k}`;
                return k === "size" ? (
                  <div key={k} className={styles.group}>
                    <span id={id} className={styles.label}>{cap(words(k))}</span>
                    <div className={styles.segment} role="group" aria-labelledby={id}>
                      {order(v.enum!).map((opt) => (
                        <button key={opt} type="button" className={[styles.segBtn, state[k] === opt ? styles.segOn : ""].join(" ")} aria-pressed={state[k] === opt} onClick={() => set(k, opt)}>{opt}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div key={k} className={styles.group} role="radiogroup" aria-labelledby={id}>
                    <span id={id} className={styles.label}>{cap(words(k))}</span>
                    {/* Number enums (like columns) keep their type so code prints columns={2}. */}
                    {v.enum!.map((opt) => (
                      <label key={String(opt)} className={styles.radio}>
                        <input type="radio" name={id} value={String(opt)} checked={state[k] === opt} onChange={() => set(k, opt)} />
                        {cap(String(opt))}
                      </label>
                    ))}
                  </div>
                );
              })}
              {toggles.length > 0 && (
                <div className={styles.group}>
                  <span className={styles.label}>Content</span>
                  {toggles.map(([k, t]) => (
                    <Switch key={k} size="sm" label={t.label} checked={Boolean(state[k])} onChange={(v) => set(k, v)} />
                  ))}
                </div>
              )}
              {bools.length > 0 && (
                <div className={styles.group}>
                  <span className={styles.label}>States</span>
                  {/* State toggles are the real kit Switch. */}
                  {bools.map(([k]) => (
                    <Switch key={k} size="sm" label={cap(words(k))} checked={Boolean(state[k])} onChange={(v) => set(k, v)} />
                  ))}
                </div>
              )}
            </aside>)}
          </div>
          <div className={styles.docs}>
            <div className={styles.detail}>
              <h3 className={styles.detailLabel}>Usage</h3>
              <p className={styles.detailText}>{contract.usage ?? contract.intent}</p>
            </div>
            <Code code={snippet} id="preview" c={c} />
          </div>
        </div>
      ) : (
        <div className={styles.examples}>
          {(contract.examples ?? []).map((ex, i) => {
            const captioned = ex.items.some((it) => it.caption);
            const code = ex.items.map((it) => {
              const p = { ...entry.snippet, ...it.props };
              const long = Object.keys(p).filter((k) => k !== "children").length > 4;
              return toJsx(contract.name, long ? p : it.props, keys, long, childName);
            }).join("\n")
              + (ex.a11y ? `\n\n// ${file} a11y\n${contract.a11y.map((r) => `// - ${r}`).join("\n")}` : "");
            return (
              <section key={ex.title} className={styles.example}>
                <h3 className={styles.h2}>{ex.title}</h3>
                <div className={styles.exampleCanvas}>
                  {captioned ? (
                    <div className={styles.cells}>
                      {ex.items.map((it, j) => (
                        <div key={j} className={styles.cell}>
                          <span className={styles.caption}>{it.caption}</span>
                          {entry.render(it.props)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={entry.block ? [styles.stack, entry.wide ? styles.wide : ""].join(" ") : entry.flush ? styles.flush : entry.column ? styles.column : styles.items}>{ex.items.map((it, j) => <div key={j}>{entry.render(it.props)}</div>)}</div>
                  )}
                </div>
                <div className={styles.detail}>
                  <h4 className={styles.detailLabel}>{ex.a11y ? "Built in" : "Usage"}</h4>
                  <p className={styles.detailText}>{ex.a11y ? [...contract.a11y, ex.usage].filter(Boolean).join(" ") : ex.usage}</p>
                </div>
                <Code code={code} id={`ex-${i}`} c={c} />
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
