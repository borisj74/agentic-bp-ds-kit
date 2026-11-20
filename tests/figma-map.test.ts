import { describe, expect, it } from "vitest";
import { checkMap, readContracts, readMap } from "../scripts/figma/check-map.mjs";

const map = readMap();
const contracts = readContracts();

describe("contracts to Figma map", () => {
  it("agrees with the contracts", () => {
    expect(checkMap(map, contracts).findings).toEqual([]);
  });

  it("has one entry per contract with a Figma node", () => {
    const withNode = contracts.filter((c) => c.figma?.nodeId);
    expect(Object.keys(map.components)).toHaveLength(withNode.length);
  });

  it("catches an entry whose nodeId drifted from its contract", () => {
    const bent = structuredClone(map);
    bent.components.Button.nodeId = "0:1";
    expect(checkMap(bent, contracts).findings).toEqual([
      { where: "Button", message: "nodeId 0:1 does not match the contract's 110:4947" },
    ]);
  });

  it("catches a mapped prop the contract does not have", () => {
    const bent = structuredClone(map);
    bent.components.Button.props.nope = { figma: "nope#1:1", kind: "boolean" };
    expect(checkMap(bent, contracts).findings).toContainEqual({
      where: "Button",
      message: "props.nope is not a prop in contracts/button.json",
    });
  });

  it("catches an enum value that is neither a Figma value nor listed under noFigma", () => {
    const bent = structuredClone(map);
    bent.components.Button.props.intent.values = ["brand", "neutral"];
    expect(checkMap(bent, contracts).findings).toContainEqual({
      where: "Button",
      message: 'intent value "danger" is neither a Figma value nor listed under noFigma',
    });
  });

  it("catches two props claiming the same Figma key", () => {
    const bent = structuredClone(map);
    bent.components.Button.props.fullWidth = { figma: "iconEnd#110:194", kind: "boolean" };
    expect(checkMap(bent, contracts).findings).toContainEqual({
      where: "Button",
      message: "figma key iconEnd#110:194 is claimed by both props.iconEnd and props.fullWidth",
    });
  });
});
