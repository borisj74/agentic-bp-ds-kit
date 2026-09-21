import { describe, expect, it } from "vitest";
import { buildRequest, checkName, element, parseCss, readSemantic, scanCss, tokenIndex } from "../scripts/audit-tokens.mjs";

const tokens = tokenIndex(readSemantic());
const known = new Set<string>([...tokens.keys(), "--space-small"]);

describe("token name grammar", () => {
  it("accepts every name in the source", () => {
    expect(readSemantic().flatMap(checkName)).toEqual([]);
  });

  it("rejects unknown parts and out-of-order modifiers", () => {
    expect(checkName("background/brand/hover/strong")[0]).toMatch(/out of order/);
    expect(checkName("background/blurple")[0]).toMatch(/unknown family/);
    expect(checkName("fill/brand")[0]).toMatch(/unknown role/);
    expect(checkName("background/neutral/min/static")).toEqual([]);
  });
});

describe("css scan", () => {
  it("keeps selector and comment with each declaration", () => {
    const [d] = parseCss("/* why */ .a:hover { color: var(--text-brand); }");
    expect(d).toMatchObject({ selector: ".a:hover", property: "color", comment: "why" });
  });

  it("flags a role that does not fit the property", () => {
    const { findings } = scanCss(".c { border-color: var(--bg-brand); color: var(--text-brand); }", tokens, known);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ check: "role", token: "--bg-brand", tokenRole: "background" });
  });

  it("flags primitive ramps and missing tokens, not component-local vars", () => {
    const css = ".a { --gap: 4px; margin: var(--gap); padding: var(--space-huge); color: var(--ui-neutral-900); width: var(--fs); }";
    const checks = scanCss(css, tokens, known).findings.map((f: { check: string; token: string }) => `${f.check} ${f.token}`);
    expect(checks).toEqual(["unknown --space-huge", "primitive --ui-neutral-900"]);
  });
});

describe("element notes", () => {
  it("finds the element a selector styles", () => {
    expect(element(".option[data-checked]:hover:not([data-disabled]) .control")).toBe(".control");
    expect(element(".input:checked + .box, .x")).toBe(".box");
    expect(element(".a::before")).toBe(".a");
  });

  it("carries a base rule's comment to its hover rule", () => {
    const css = "/* 3:1 contrast */ .box { border-color: var(--icon-neutral-subtle); } .a:hover .box { border-color: var(--icon-neutral); }";
    const { uses } = scanCss(css, tokens, known);
    expect(uses[1].elementNotes).toEqual(["3:1 contrast"]);
    expect(uses[0].elementNotes).toEqual([]);
  });
});

describe("TypeSafe request", () => {
  it("asks a fit Score per use and a justified Noul only for role mismatches", () => {
    const { uses } = scanCss(".c { border-color: var(--bg-brand); color: var(--text-brand); }", tokens, known);
    const body = buildRequest("RadioGroup", "Pick one option", uses) as unknown as {
      questions: Record<string, { type: string }>;
      state: { declarations: { token: string }[] };
    };
    expect(Object.keys(body.questions)).toEqual(["fit_0", "justified_0", "fit_1"]);
    expect(body.questions.fit_0.type).toBe("score");
    expect(body.questions.justified_0.type).toBe("noul");
    expect(body.state.declarations[0].token).toBe("--bg-brand");
  });
});
