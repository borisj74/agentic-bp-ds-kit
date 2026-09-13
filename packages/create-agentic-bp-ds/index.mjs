#!/usr/bin/env node
// npm create agentic-bp-ds@latest [folder]
// Copies the latest kit from GitHub into a new folder, installs it and tells you how to start. No dependencies:
// it downloads the repo tarball with fetch and unpacks it with the system tar (macOS, Linux and Windows 10+).

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";

const REPO = "borisj74/agentic-bp-ds-kit";
const TARBALL = `https://codeload.github.com/${REPO}/tar.gz/refs/heads/main`;
// Files that belong to the kit's own repo, not to a prototype made from it.
const DROP = ["packages", "LICENSE"];

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const fail = (msg) => {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
};

const [major] = process.versions.node.split(".").map(Number);
if (major < 20) fail(`Node ${process.versions.node} is too old. Install Node 20 or newer from https://nodejs.org and try again.`);

let name = process.argv[2];
if (!name) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  name = (await rl.question(`  Folder name ${dim("(my-prototype)")}: `)).trim() || "my-prototype";
  rl.close();
}

const target = resolve(name);
if (existsSync(target) && readdirSync(target).length > 0) fail(`The folder "${name}" already exists and is not empty. Pick another name.`);

console.log(`\n  Downloading the kit into ${bold(name)} ...`);
const res = await fetch(TARBALL).catch(() => null);
if (!res?.ok) fail("Could not download the kit. Check your internet connection and try again.");

const archive = join(tmpdir(), `agentic-bp-ds-${Date.now()}.tar.gz`);
writeFileSync(archive, Buffer.from(await res.arrayBuffer()));
mkdirSync(target, { recursive: true });
const untar = spawnSync("tar", ["-xzf", archive, "--strip-components=1", "-C", target], { stdio: "inherit" });
rmSync(archive, { force: true });
if (untar.status !== 0) fail("Could not unpack the kit. Make sure the tar command is available.");

for (const entry of DROP) rmSync(join(target, entry), { recursive: true, force: true });

const pkgPath = join(target, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = basename(target).toLowerCase().replace(/[^a-z0-9-_.]/g, "-");
pkg.version = "0.1.0";
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

// Install with whichever tool ran this (npm, pnpm, yarn or bun).
const agent = (process.env.npm_config_user_agent ?? "npm").split("/")[0];
const pm = ["pnpm", "yarn", "bun"].includes(agent) ? agent : "npm";
console.log(`  Installing with ${pm} ...\n`);
const install = spawnSync(pm, ["install"], { cwd: target, stdio: "inherit", shell: process.platform === "win32" });

const run = pm === "npm" ? "npm run dev" : `${pm} dev`;
console.log(`
  ${bold("Done.")} Your prototype is in ${bold(name)}.
${install.status === 0 ? "" : `\n  The install did not finish. Run ${bold(`${pm} install`)} inside the folder first.\n`}
  Start it:
    cd ${name}
    ${run}

  Then open http://localhost:3000 to browse the catalog.
  Read CLAUDE.md before you build a screen: it has the kit rules your AI assistant follows.
`);
