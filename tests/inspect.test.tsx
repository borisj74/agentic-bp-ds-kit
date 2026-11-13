import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INSPECT_ATTR, INSPECT_ENV, inspect, inspectOn } from "@/ui/inspect";
import { Button } from "@/ui/Button/Button";
import { Card } from "@/ui/Card/Card";

// The switch lives in one env var, and the tests set it the way a dev server would.
const on = () => vi.stubEnv(INSPECT_ENV, "1");

afterEach(() => vi.unstubAllEnvs());

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
