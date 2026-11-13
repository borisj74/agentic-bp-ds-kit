#!/usr/bin/env node
// npm create agentic-bp-ds@latest [folder] [-- --template <id> --route <slug>]
// Copies the kit release that matches this installer's version (git tag v<version>) from GitHub into a new folder,
// installs it and tells you how to start. No dependencies: it downloads the tag's tarball with fetch and unpacks it
// with the system tar (macOS, Linux and Windows 10+). To release: tag the kit v<version>, then publish this package.
//
// With --template it also writes a starter screen, by running the kit's own scripts/new-screen.mjs inside the
// folder it just unpacked. A kit release older than starter pages has no starters/ folder; then it says so and
// carries on without a screen.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const REPO = "borisj74/agentic-bp-ds-kit";
// Which kit release to download: the git tag that matches this installer's own version. Read when it is
// needed rather than on import, so a test can read the flag parsing below without touching the disk.
const tarballUrl = () => {
  const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
  return `https://codeload.github.com/${REPO}/tar.gz/refs/tags/v${version}`;
};
// Files that belong to the kit's own repo, not to a prototype made from it. The MCP server reads this repo's
// contracts for an agent working on the kit itself; a prototype has no use for it and should not carry its
// dependencies.
// Exported so a test can check that nothing left behind imports something that is dropped: a prototype has to
// typecheck, build and test on its own.
// `.github` goes too: the kit's own Kit fit workflow runs on the kit's pull requests, not on a prototype's.
export const DROP = [
  "packages", "LICENSE", "bin", "mcp", ".github", "tests/mcp.test.ts", "tests/create-installer.test.ts",
];
// The same, inside package.json: the bin entry and the script that start the server, and the two packages only it
// needs.
const DROP_SCRIPTS = ["mcp"];
const DROP_DEPS = ["@modelcontextprotocol/sdk", "zod"];

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const fail = (msg) => {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
};

/**
 * Reads the command line: the folder name is the first plain word, and --template and --route follow it,
 * with or without an = sign.
 * @returns {{ name?: string, template?: string, route?: string }}
 */
export function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--template" || arg === "--route") {
      out[arg.slice(2)] = argv[i + 1];
      i += 1;
    } else if (arg.startsWith("--template=") || arg.startsWith("--route=")) {
      const [key, ...rest] = arg.slice(2).split("=");
      out[key] = rest.join("=");
    } else if (!arg.startsWith("-") && out.name === undefined) {
      out.name = arg;
    }
  }
  return out;
}

/**
 * Writes the starter screen into the folder that was just unpacked, by running the kit's own copier.
 * The kit owns which starters there are and what they are called, so this only hands the flags over.
 * @param {string} target The folder the kit was unpacked into.
 * @param {{ template?: string, route?: string }} options
 * @returns {{ route: string } | null} The screen's route, or null when there is no screen.
 */
export function addStarter(target, { template, route }) {
  if (!template) return null;

  const copier = join(target, "scripts", "new-screen.mjs");
  const starters = join(target, "starters", "index.json");
  if (!existsSync(copier) || !existsSync(starters)) {
    console.log(`\n  This kit version has no starter pages yet, so --template is skipped. Carrying on without a screen.`);
    return null;
  }

  // The copier defaults the route to the starter's id. Read it here too, so the final message can print the
  // screen's address; an id we cannot find is left to the copier, which prints the real list and exits 1.
  // The copier lowercases the route, so the address printed at the end matches the folder it wrote.
  let slug = route?.trim().toLowerCase();
  if (!slug) {
    const want = String(template).trim().toLowerCase();
    const list = JSON.parse(readFileSync(starters, "utf8")).starters ?? [];
    slug = list.find((s) => s.id.toLowerCase() === want || String(s.template ?? "").toLowerCase() === want)?.id;
  }

  console.log(`\n  Writing the ${bold(template)} starter screen ...`);
  const flags = ["--template", template, ...(route ? ["--route", route] : [])];
  const made = spawnSync(process.execPath, [copier, ...flags], { cwd: target, stdio: "inherit" });
  if (made.status !== 0) {
    console.log("  No screen was written. The kit is ready all the same; run npm run new-screen inside the folder.");
    return null;
  }
  return slug ? { route: slug } : null;
}

async function main() {
  const [major] = process.versions.node.split(".").map(Number);
  if (major < 20) fail(`Node ${process.versions.node} is too old. Install Node 20 or newer from https://nodejs.org and try again.`);

  const { name: given, template, route } = parseArgs(process.argv.slice(2));
  let name = given;
  if (!name) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    name = (await rl.question(`  Folder name ${dim("(my-prototype)")}: `)).trim() || "my-prototype";
    rl.close();
  }

  const target = resolve(name);
  if (existsSync(target) && readdirSync(target).length > 0) fail(`The folder "${name}" already exists and is not empty. Pick another name.`);

  console.log(`\n  Downloading the kit into ${bold(name)} ...`);
  const res = await fetch(tarballUrl()).catch(() => null);
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
  delete pkg.bin;
  for (const script of DROP_SCRIPTS) delete pkg.scripts?.[script];
  for (const dep of DROP_DEPS) {
    delete pkg.dependencies?.[dep];
    delete pkg.devDependencies?.[dep];
  }
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

  // The screen goes in before the install, so the folder is whole by the time the packages land.
  const screen = addStarter(target, { template, route });

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

${screen
    ? `  Then open ${bold(`http://localhost:3000/${screen.route}`)} to see your screen,\n  and http://localhost:3000 to browse the catalog.`
    : `  Then open http://localhost:3000 to browse the catalog.`}
  Read CLAUDE.md before you build a screen: it has the kit rules your AI assistant follows.
`);
}

// Run only when this file is the command, so a test can read its flag parsing without downloading anything.
// npm links the bin, so both sides are followed to the real file before they are compared. Under a test
// runner import.meta.url is not a file URL at all, which answers no on its own.
const real = (path) => {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
};
const thisFile = () => {
  try {
    return real(fileURLToPath(import.meta.url));
  } catch {
    return null;
  }
};
const here = thisFile();
if (here && process.argv[1] && real(process.argv[1]) === here) await main();
