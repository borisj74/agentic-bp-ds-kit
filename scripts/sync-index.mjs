#!/usr/bin/env node
// Copies the "level" field from each contract into its row in contracts/index.json.
// The contract is the source of truth. Never hand-type a level in the index.
//
//   node scripts/sync-index.mjs          write the index
//   node scripts/sync-index.mjs --check  list the rows that drift, exit 1 if any
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The only levels a contract may use. Classic atomic design. */
export const LEVELS = ["atom", "molecule", "organism", "template"];

/** Index groups that carry a level. Foundations do not. */
const LEVELLED_GROUPS = ["components", "patterns"];

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(root, "contracts", "index.json");

function readJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), "utf8"));
}

/** Reads the index as it is on disk. */
export function readIndex() {
  return JSON.parse(readFileSync(indexPath, "utf8"));
}

/**
 * Compares every index row with its contract.
 * Returns one entry per row whose level does not match the contract.
 */
export function findDrift() {
  const index = readIndex();
  const drift = [];
  for (const group of LEVELLED_GROUPS) {
    for (const row of index[group] ?? []) {
      const contract = readJson(row.contract);
      if (row.level !== contract.level) {
        drift.push({
          group,
          name: row.name,
          index: row.level,
          contract: contract.level,
        });
      }
    }
  }
  return drift;
}

/** Puts "level" right after "contract" and keeps every other field in place. */
function withLevel(row, level) {
  const next = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === "level") continue;
    next[key] = value;
    if (key === "contract") next.level = level;
  }
  if (!("level" in next)) next.level = level;
  return next;
}

/** Writes the index with each row's level copied from its contract. */
export function syncIndex() {
  const index = readIndex();
  for (const group of LEVELLED_GROUPS) {
    index[group] = (index[group] ?? []).map((row) =>
      withLevel(row, readJson(row.contract).level),
    );
  }
  writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  return index;
}

function main() {
  const check = process.argv.includes("--check");
  if (check) {
    const drift = findDrift();
    if (drift.length === 0) {
      console.log("contracts/index.json is in sync.");
      return;
    }
    console.error(`${drift.length} row(s) drift from their contract:`);
    for (const row of drift) {
      console.error(
        `  ${row.name} (${row.group}): index ${JSON.stringify(row.index)}, contract ${JSON.stringify(row.contract)}`,
      );
    }
    console.error("Run: npm run sync:index");
    process.exitCode = 1;
    return;
  }
  syncIndex();
  console.log("contracts/index.json written from the contracts.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
