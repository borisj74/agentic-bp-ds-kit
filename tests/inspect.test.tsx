import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INSPECT_ATTR, INSPECT_ENV, INSPECT_ENV_PLAIN, inspect, inspectOn, setInspect } from "@/ui/inspect";
import { Button } from "@/ui/Button/Button";
import { Card } from "@/ui/Card/Card";

// The switch lives in one env var, and the tests set it the way a dev server would.
const on = () => vi.stubEnv(INSPECT_ENV, "1");

afterEach(() => {
  vi.unstubAllEnvs();
  setInspect(undefined);
  delete (globalThis as Record<string, unknown>)[INSPECT_ENV_PLAIN];
});

describe("the name tag", () => {
  it("is off when the switch is not set", () => {
    expect(inspectOn()).toBe(false);
    expect(inspect("Button")).toEqual({});
  });

  it("is on with the switch set", () => {
    on();
    expect(inspectOn()).toBe(true);
    expect(inspect("Button")).toEqual({ [INSPECT_ATTR]: "Button" });
  });

  it("stays off in a production build, switch or no switch", () => {
    on();
    vi.stubEnv("NODE_ENV", "production");
    expect(inspectOn()).toBe(false);
    expect(inspect("Button")).toEqual({});
  });
});

describe("a kit piece on a screen", () => {
  it("wears no name tag by default", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).not.toHaveAttribute(INSPECT_ATTR);
  });

  it("wears its contract name on its root with the switch on", () => {
    on();
    render(<Card title="Invoices" />);
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(INSPECT_ATTR, "Button");
    expect(document.querySelector(`[${INSPECT_ATTR}="Card"]`)).toBeInTheDocument();
  });
});

// The switch has to work in a plain React app too, where there is no Next to inline a NEXT_PUBLIC_* var.
describe("the switch outside Next", () => {
  it("reads the plain env var", () => {
    vi.stubEnv(INSPECT_ENV_PLAIN, "1");
    expect(inspectOn()).toBe(true);
    expect(inspect("Button")).toEqual({ [INSPECT_ATTR]: "Button" });
  });

  it("reads a global, for a host that sets no env var", () => {
    (globalThis as Record<string, unknown>)[INSPECT_ENV_PLAIN] = "1";
    expect(inspectOn()).toBe(true);
    (globalThis as Record<string, unknown>)[INSPECT_ENV_PLAIN] = false;
    expect(inspectOn()).toBe(false);
  });

  it("takes setInspect over the env", () => {
    vi.stubEnv(INSPECT_ENV, "1");
    setInspect(false);
    expect(inspectOn()).toBe(false);
    setInspect(true);
    expect(inspectOn()).toBe(true);
    setInspect(undefined);
    expect(inspectOn()).toBe(true);
  });

  it("takes a per-call switch over everything but the build mode", () => {
    expect(inspect("Button", { on: true })).toEqual({ [INSPECT_ATTR]: "Button" });
    vi.stubEnv(INSPECT_ENV, "1");
    expect(inspect("Button", { on: false })).toEqual({});
    vi.stubEnv("NODE_ENV", "production");
    expect(inspect("Button", { on: true })).toEqual({});
  });

  it("does not crash where there is no process at all", () => {
    const real = globalThis.process;
    // @ts-expect-error - a browser bundle with no process shim is exactly the case being covered.
    delete globalThis.process;
    try {
      expect(inspectOn()).toBe(false);
      expect(inspect("Button")).toEqual({});
    } finally {
      globalThis.process = real;
    }
  });
});
