// Checks contracts/figma-map.json against the contracts. Offline: it reads files only,
// never Figma. Run it with `npm run figma:check`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, "..", "..");
const CONTRACTS = path.join(root, "contracts");
const MAP_FILE = path.join(CONTRACTS, "figma-map.json");

const THEME_COLLECTIONS = ["Ref", "Scheme", "Semantic", "Dimension", "Density", "Label width"];

export function readMap(file = MAP_FILE) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function readContracts(dir = CONTRACTS) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json") && f !== "index.json" && f !== "figma-map.json")
    .sort()
    .map((f) => ({ file: `contracts/${f}`, ...JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) }));
}

const lower = (value) => String(value).toLowerCase();
const propNames = (contract) => Object.keys(contract.props ?? {});

// A mapped key is either a bare variant name or a property key with its #id.
const keyKindFits = (kind, key) => (kind === "variant" ? !key.includes("#") : key.includes("#"));

export function checkMap(map = readMap(), contracts = readContracts()) {
  const findings = [];
  const add = (where, message) => findings.push({ where, message });

  if (map.fileKey !== "ELFJs16lnRVQaOrxhMVrVf") add("figma-map.json", `fileKey is ${map.fileKey}`);

  for (const name of THEME_COLLECTIONS) {
    const theme = map.themes?.[name];
    if (!theme) {
      add("themes", `collection ${name} is missing`);
      continue;
    }
    if (!theme.collectionKey) add(`themes.${name}`, "collectionKey is missing");
    if (!Array.isArray(theme.modes) || theme.modes.length === 0) add(`themes.${name}`, "modes are missing");
  }

  const mapped = new Set(Object.keys(map.components ?? {}));
  const withNode = contracts.filter((c) => c.figma?.nodeId);

  for (const contract of withNode) {
    const entry = map.components?.[contract.name];
    if (!entry) {
      add(contract.name, "contract has a figma.nodeId but no entry in the map");
      continue;
    }
    mapped.delete(contract.name);

    if (entry.contract !== contract.name) add(contract.name, `entry.contract is ${entry.contract}`);
    if (entry.nodeId !== contract.figma.nodeId) {
      add(contract.name, `nodeId ${entry.nodeId} does not match the contract's ${contract.figma.nodeId}`);
    }
    if (contract.figma.fileKey && contract.figma.fileKey !== map.fileKey) {
      add(contract.name, `contract fileKey ${contract.figma.fileKey} is not the mapped file`);
    }
    if (!/^[0-9a-f]{40}$/.test(String(entry.key))) add(contract.name, `key ${entry.key} is not a Figma key`);
    if (entry.keyKind !== "componentSetKey" && entry.keyKind !== "componentKey") {
      add(contract.name, `keyKind ${entry.keyKind} is neither componentSetKey nor componentKey`);
    }
    if (!entry.publish) add(contract.name, "publish status is missing");

    const own = new Set(propNames(contract));
    const seenKeys = new Map();
    const claim = (key, owner) => {
      if (seenKeys.has(key)) add(contract.name, `figma key ${key} is claimed by both ${seenKeys.get(key)} and ${owner}`);
      else seenKeys.set(key, owner);
    };

    for (const [prop, mapping] of Object.entries(entry.props ?? {})) {
      if (!own.has(prop)) add(contract.name, `props.${prop} is not a prop in ${contract.file}`);
      if (!mapping.figma) add(contract.name, `props.${prop} has no figma key`);
      else claim(mapping.figma, `props.${prop}`);
      if (!mapping.kind) add(contract.name, `props.${prop} has no kind`);
      else if (mapping.figma && !keyKindFits(mapping.kind, mapping.figma)) {
        add(contract.name, `props.${prop} is ${mapping.kind} but its key is ${mapping.figma}`);
      }
    }

    for (const [prop, slot] of Object.entries(entry.slots ?? {})) {
      if (!own.has(prop)) add(contract.name, `slots.${prop} is not a prop in ${contract.file}`);
      if (!Array.isArray(slot.show)) add(contract.name, `slots.${prop}.show is not a list`);
      else slot.show.forEach((key) => claim(key, `slots.${prop}.show`));
      // The path to the layer a row sets, as it was read in the file: names split on >, with @N for
      // the Nth child, $column for the column's own layer name, and N and R for the column and the
      // row number. A path that names no row and no column could only ever set one layer.
      if (slot.child !== undefined && (typeof slot.child !== "string" || slot.child.trim() === ""))
        add(contract.name, `slots.${prop}.child is not a path`);
      if (slot.layers !== undefined) {
        if (!Array.isArray(slot.layers) || slot.layers.some((name) => typeof name !== "string"))
          add(contract.name, `slots.${prop}.layers is not a list of layer names`);
        else if (slot.max !== undefined && slot.layers.length !== slot.max)
          add(contract.name, `slots.${prop}.layers has ${slot.layers.length} names and max is ${slot.max}`);
      }
      // Layers are only of use to a path that reaches for a column, by name or by place.
      if (slot.layers && !/@N|\$column/.test(String(slot.child ?? "")))
        add(contract.name, `slots.${prop}.layers is listed but slots.${prop}.child reaches for no column`);
    }

    // What an instanceSwap slot ships with: the component set it swaps in and the parts it draws.
    for (const [prop, mapping] of Object.entries(entry.props ?? {})) {
      const swap = mapping?.swap;
      if (!swap) continue;
      if (mapping.kind !== "instanceSwap") add(contract.name, `props.${prop}.swap is on a ${mapping.kind} property`);
      if (typeof swap.key !== "string" || swap.key.length !== 40) add(contract.name, `props.${prop}.swap.key is not a component key`);
      // An empty roster is a real answer: the slot ships blank and takes exactly one component.
      if (!Array.isArray(swap.roster) || swap.roster.some((name) => typeof name !== "string"))
        add(contract.name, `props.${prop}.swap.roster is not a list of component names`);
    }

    // A part of the frame itself, by the path it sits at in the file.
    for (const [part, path] of Object.entries(entry.frameLayers ?? {})) {
      if (typeof path !== "string" || path.trim() === "") add(contract.name, `frameLayers.${part} is not a path`);
    }

    // The instance Figma exposes inside an artboard part, by the path it sits at in the file.
    for (const [prop, path] of Object.entries(entry.partLayers ?? {})) {
      if (!own.has(prop)) add(contract.name, `partLayers.${prop} is not a prop in ${contract.file}`);
      if (typeof path !== "string" || !/\bN\b/.test(path)) add(contract.name, `partLayers.${prop} "${path}" does not number its parts with N`);
    }

    for (const prop of Object.keys(entry.stateMap ?? {})) {
      if (!own.has(prop)) add(contract.name, `stateMap.${prop} is not a prop in ${contract.file}`);
    }
    for (const prop of Object.keys(entry.modes ?? {})) {
      if (!own.has(prop)) add(contract.name, `modes.${prop} is not a prop in ${contract.file}`);
    }

    for (const [key, reason] of Object.entries(entry.noFigma ?? {})) {
      const prop = key.includes(".") ? key.slice(0, key.indexOf(".")) : key;
      if (!own.has(prop)) add(contract.name, `noFigma.${key} is not a prop in ${contract.file}`);
      if (!reason || String(reason).includes("\n")) add(contract.name, `noFigma.${key} needs a one-line reason`);
    }

    for (const key of Object.keys(entry.figmaOnly ?? {})) {
      if (seenKeys.has(key)) add(contract.name, `figmaOnly.${key} is also mapped by ${seenKeys.get(key)}`);
    }

    // Every closed enum value is either a Figma value or listed under noFigma.
    for (const [prop, def] of Object.entries(contract.props ?? {})) {
      if (!Array.isArray(def.enum)) continue;
      const mapping = entry.props?.[prop];
      for (const value of def.enum) {
        const inFigma = mapping?.values?.some((v) => lower(v) === lower(value));
        const listed =
          Object.prototype.hasOwnProperty.call(entry.noFigma ?? {}, `${prop}.${value}`) ||
          Object.prototype.hasOwnProperty.call(entry.noFigma ?? {}, prop);
        if (!inFigma && !listed) {
          add(contract.name, `${prop} value "${value}" is neither a Figma value nor listed under noFigma`);
        }
      }
    }
  }

  for (const name of mapped) add(name, "entry has no contract with that name");

  const noNode = contracts.filter((c) => !c.figma?.nodeId).map((c) => c.name);
  for (const name of noNode) {
    if (map.components?.[name]) add(name, "contract has no figma.nodeId but the map has an entry");
  }

  return { findings, counted: withNode.length, skipped: noNode };
}

export function report({ findings, counted, skipped }) {
  const lines = [];
  for (const f of findings) lines.push(`${f.where}: ${f.message}`);
  lines.push("");
  lines.push(`${counted} contracts with a Figma node checked, ${skipped.length} skipped (${skipped.join(", ")}).`);
  lines.push(findings.length === 0 ? "figma-map.json agrees with the contracts." : `${findings.length} problem(s).`);
  return lines.join("\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = checkMap();
  console.log(report(result));
  process.exit(result.findings.length === 0 ? 0 : 1);
}
