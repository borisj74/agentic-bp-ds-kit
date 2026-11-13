# Agentic BP DS

A code-first design system for prototyping product screens with an AI assistant. Describe a screen, and the assistant builds it from the kit's own components and patterns.

This README follows the **Start** pages in the catalog (Overview, Installation, Using patterns and Prompting). Run the kit and open them for the always-current version.

- [Overview](#overview)
- [Installation](#installation)
- [Using patterns](#using-patterns)
- [Prompting](#prompting)
- [What's in the repo](#whats-in-the-repo)

---

## Overview

### What it is

A ready-made kit for building realistic, clickable screens quickly. Everything lives in code: there is no separate design file to keep in step.

- **Foundations:** color, type, spacing, icons, radius, shadow and motion, as tokens.
- **Components:** buttons, fields, tables, menus, dialogs, charts and more, each in one folder.
- **Patterns:** whole-screen blueprints, like a list page or a record page, built from the components.
- **Contracts:** one file per piece that says what it is for, its `level` (`atom`, `molecule`, `organism` or `template`), its options and what not to do. The assistant reads these before it builds.
- **Rules for the assistant:** `CLAUDE.md` and the `/prototype-from-kit` skill keep every screen consistent.
- **The catalog:** every piece, live, with its options and code to copy.

### What it isn't

- **Not a production library.** It is for prototypes, tests and conversations, not for shipping.
- **Not connected to real data.** Screens use sample data. Buttons only do something when the prototype wires them up.
- **Not a design tool file.** The code is the source of truth.
- **Not a place for one-off parts.** When a screen needs something the kit does not have, it gets added to the kit properly, or the screen changes.

### What to expect

- **Realistic screens in minutes,** with real tables, forms, menus and dialogs you can click through.
- **Consistency without effort:** spacing, color, type and behavior come from the kit, so screens match each other.
- **Desktop, tablet and phone:** components and patterns adapt to the space they have.
- **Light and dark themes,** switched from the catalog's top bar.
- **Keyboard and screen reader basics** built into the components: labels, focus and keys.
- **An assistant that stops and asks** when a piece is missing, instead of inventing one.

> **Your copy is a snapshot.** A prototype starts as a copy of the kit on the day you create it. Later kit changes do not reach it on their own. Start a new prototype to get them.

### What's inside

| | Count | Includes |
| --- | --- | --- |
| Foundation pages | 10 | Color, Typography, Icons, Spacing, Grid systems, Radius, Border, Shadow, Motion, Opacity |
| Components | 76 | Controls, fields, data, navigation, feedback and charts |
| Patterns | 9 | AccountFlow, AppShell, ChatWindow, Dashboard, FormPage, GuidedProcessPage, ListPage, RecordPage, SettingsPage |

Counts are as of this README. The catalog's Overview page counts them live from `contracts/index.json`.

---

## Installation

### Before you start

- **Node.js 20 or newer.** Download it from [nodejs.org](https://nodejs.org). Check with `node -v`.
- **A terminal:** Terminal on a Mac, PowerShell on Windows, or the one in your code editor.
- **An AI coding assistant,** like Claude Code, to build screens. You can browse the catalog without one.

### Option 1: One command (recommended)

Makes a new folder with the latest release of the kit and installs it. Run this in the folder where you keep your projects, and change `my-prototype` to any name:

```bash
npm create agentic-bp-ds@latest my-prototype
```

Then go into the folder and start it:

```bash
cd my-prototype
npm run dev
```

#### Start from a working screen

> **Not live yet.** The `--template` flag below works from the next kit release onwards. The installer on npm today ignores it, and the release it downloads has no `starters/` folder. Until then, make the folder the plain way and run `npm run new-screen` inside it, as under [Add a screen](#add-a-screen).

Add `--template` and the folder comes with a screen already built, instead of only the catalog:

```bash
npm create agentic-bp-ds@latest my-prototype -- --template dashboard
```

The screen lands at `src/app/dashboard/page.tsx` and opens at http://localhost:3000/dashboard. `--route` puts it somewhere else:

```bash
npm create agentic-bp-ds@latest my-prototype -- --template dashboard --route sales
```

A kit release older than starter pages has no `starters/` folder; then the installer says so and carries on without a screen, which is what happens with the installer on npm today.

### Option 2: GitHub template

For a prototype that lives in its own GitHub repository, to share or deploy.

1. Open [github.com/borisj74/agentic-bp-ds-kit](https://github.com/borisj74/agentic-bp-ds-kit).
2. Click **Use this template**, then **Create a new repository**, and name it.
3. Clone your new repository, then install and start it:

```bash
git clone <your repository address> my-prototype
cd my-prototype
npm install
npm run dev
```

### Option 3: Clone the kit

For changing the kit itself: adding a component or fixing one.

```bash
git clone https://github.com/borisj74/agentic-bp-ds-kit.git
cd agentic-bp-ds-kit
npm install
npm run dev
```

### Run it

With `npm run dev` running, open **http://localhost:3000**. The page updates as files change. Stop the server with **Ctrl + C**.

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the catalog and your screens |
| `npm run new-screen -- --template <id> --route <slug>` | Writes a starter screen into `src/app/<slug>/page.tsx` |
| `npm run build` | Checks that everything builds, as it would before deploying |
| `npm run lint` | Checks the code for common mistakes |
| `npm test` | Runs the unit, interaction and accessibility tests |
| `npm run test:watch` | Reruns the tests as files change |
| `npm run tokens` | Rebuilds the token CSS after editing `src/tokens/source` |
| `npm run sync:index` | Copies each contract's `level` into `contracts/index.json` (`--check` only reports) |

### Add a screen

Inside a kit folder you already have, `npm run new-screen` copies a starter page into your app:

```bash
npm run new-screen -- --template dashboard --route sales
```

- `--template` is the starter: `list`, `record`, `form`, `dashboard`, `list-detail`, `settings`, `guided-process` or `blank`. It also takes the name of the pattern the starter is built on, so `--template Dashboard` works too. An unknown name prints the list.
- `--route` is the address the screen gets. It defaults to the starter's id, and is lowercased, so `--route Sales` lands at `/sales`. It has to be a plain slug otherwise: letters, numbers and single dashes. The catalog's own routes (`components`, `patterns`, `foundations`, `start`) are refused.
- `--force` overwrites a page that is already there. Without it, an existing page is left alone.

The starters are in `starters/`: one folder per starter, plus `starters/index.json` listing them. They are pages, not contracts — a template filled with real-looking content — so they have no `level` and are not in `contracts/index.json`. Each one only composes kit pieces and patterns.

### Review a screen

The kit reviews a screen against its own contracts, offline:

```bash
npm run review -- src/app/invoices/page.tsx
```

Paths can be files or folders; a folder is walked for `.tsx` and `.css`. The review names, with the line and a fix:

| Rule | What it finds |
| --- | --- |
| `bp/raw-value` | A colour, or a px spacing, radius or shadow, typed in by hand instead of a token or a layout class |
| `bp/primitive-token` | A `--ref-*` or `--ui-*` ramp outside `src/tokens`, or a token no token file defines |
| `bp/local-cousin` | A kit piece rebuilt in the file, imported from somewhere other than `@/ui` and `@/patterns`, or UI taken from another screen's folder. The screen's own folder is fine |
| `bp/closed-enum` | A prop or a value a piece's contract does not allow (`tone=`, Button `variant=`, an `emphasis` x `intent` pair that is not allowed) |
| `bp/one-primary` | More than one `emphasis="strong" intent="brand"` Button in one file |
| `bp/use-pattern` | A screen that builds most of a pattern by hand, with the pattern and the starter to use instead |
| `bp/use-bigger-piece` | A screen that builds an organism out of its own parts, with the organism to use instead |
| `bp/screen-frame` | A full screen with no `AppShell` and side nav, breadcrumbs that do not start with Home, or a page grid written by hand |

The first five are errors and the last three are warnings; the command exits 1 when there is any error, so it fits a
pre-commit hook or CI. `--json` prints one object for a machine to read. The kit's own folders (`src/ui`,
`src/patterns`, `src/tokens`, `tests`) are left out unless you pass `--all`.

An assistant runs the same check itself with the `review_ui` MCP tool, including on a draft it has not saved yet.
Run the review before you hand a screen back, and fix the errors.

#### The Kit fit score

`--score` turns the same read into one number:

```bash
npm run review -- --score src/app/invoices
```

```
Kit fit = round(100 × kit elements ÷ all UI elements) − 5 × errors, kept inside 0–100
```

Kit elements are the components and patterns in `contracts/index.json`. All UI elements are every element that draws
something, kit pieces and plain tags alike; tags that draw nothing, like `<title>` or a fragment, are left out. Only
errors cost points. A file with no elements, like a CSS module on its own, scores 100. The score is in `--json` too,
under `score`, with the same numbers and the formula.

`.github/workflows/kit-review.yml` runs the review on the `.tsx` and `.css` files a pull request touches under
`src/app`, `src/patterns` and `starters`, and posts one comment with the score and the top ten findings, updated on
every push. It only reports: it never fails a pull request. To turn it off, delete the workflow file. The playground
explains the score in plain words at `/start/review`.

### Work with the assistant

Open the prototype folder in your AI coding assistant. The rules come with the kit, so there is nothing to set up:

- `CLAUDE.md` holds the kit rules the assistant follows on every request.
- `/prototype-from-kit` runs the **Prototype from kit** skill, which walks the assistant through building a screen from the kit.
- `contracts/` tells it what each piece is for and which options it has.

Read [Prompting](#prompting) before your first screen.

### Getting updates

> **Prototypes do not update on their own.** Each prototype is a copy of the kit from the day it was made. To use newer components, start a new prototype with Option 1 and move your screens across.

Working from a clone of the kit (Option 3)? Run `git pull` and then `npm install`.

What changed in each release is in [CHANGELOG.md](CHANGELOG.md). Breaking releases say what to rename or run.

Some releases rename pieces or props. When you move screens into a newer kit, run the matching script over your screen folders, oldest first, then `npx tsc --noEmit` to catch anything it missed. Each script is safe to run twice.

| Script | What it renames |
| --- | --- |
| `node scripts/codemod-a2-rulings.mjs src/app` | `tone` to `intent` |
| `node scripts/codemod-a3-renames.mjs src/app` | Alert to Callout, Empty to EmptyState, Progress to Meter, ProgressLegacy to ProgressBar, ButtonFilter to FilterButton, SegmentedControl to Segmented, Stepper to Steps, DropdownMenu to Dropdown, ShimmerText to TextLoader, Command to GlobalSearch, Tile to NavTile, SideNav to AppNav, and the props that moved with them |
| `node scripts/codemod-a4a-button.mjs src/app` | Button `variant` to `emphasis` + `intent` (primary → strong brand, secondary → subtle, tertiary → minimal, danger → strong danger), `pressed` to `toggle`, the same on Dropdown's button trigger, Cell and GuidedProcess action data, and AlertDialog `actionVariant` to `actionIntent` |

### If something goes wrong

- **"Node is too old":** install Node.js 20 or newer, open a new terminal, and run the command again.
- **"The folder is not empty":** pick a new folder name.
- **The install stopped halfway:** go into the folder and run `npm install`.
- **Port 3000 is busy:** the terminal shows another address, like localhost:3001. Open that one.
- **The page is blank or out of date:** stop the server, run `npm run dev` again and reload.

---

## Using patterns

Patterns are blueprints for whole screens. Start every screen from one, and the layout, spacing and behavior come with it.

### How patterns work

- **A pattern lays out a screen.** It places the header, toolbar, content and footer in the right spots, at every width.
- **It is built only from kit components.** It adds no new parts of its own.
- **It keeps no data.** Your screen owns the rows, the form values and what is selected, and passes them in.
- **It has slots.** Props like `header`, `toolbar` and `children` take kit components you fill in.

### How to use a pattern

1. **Frame the page with AppShell** when it is a full screen with the side navigation and top bar. Give its AppNav the full app navigation, `APP_NAV` and `APP_NAV_END` from `@/patterns/AppShell/appNav`, so every prototype has every link.
2. **Pick the page pattern** that matches the screen, using the list below.
3. **Read its contract** in `contracts/`: the slots, the options and the do-nots.
4. **Fill the slots with the kit components** listed under "Built from".
5. **Check it at every width** with the Stage control on the pattern's page in the catalog.
6. **Missing something?** Stop and decide: add the piece to the kit, or change the screen. Do not build a one-off.

### The patterns

| Pattern | What it is | Use it for | Built from |
| --- | --- | --- | --- |
| **AccountFlow** | The account provisioning flow: the accounts list, one account with its tabs, a new account, and a new product on an account, one page at a time. | Account screens that link together: find an account, open it, add an account or a product. | AppShell, ListPage, RecordPage, FormPage, Toolbar, Table, Tabs, Form, FormDisplay, LinkList and more |
| **AppShell** | The frame every product screen sits in: the bar across the top, the rail down the side, the page in the middle, and the assistant beside it. | Any product screen: a list, a record, a dashboard. | AppHeader, AppNav, PageHeader, ChatWindow, Section |
| **ChatWindow** | The assistant window: its header over the turns, the composer at the foot, and the saved chats beside or over them. | The assistant docked beside a product screen. | ChatHeader, ChatMessage, ChatComposer, ChatList, EmptyState |
| **Dashboard** | The home screen of a job: the numbers that matter, grouped, with the charts and lists that explain them. | A home screen that reports on a job: what is owed, what is due, what closed. | Toolbar, Section, Scoreboard, BarChart, LineChart, PieChart, Legend, Table, Timeline, EmptyState, Skeleton |
| **FormPage** | One record being filled in: its name and the save at the top, anything to read first under that, and the fields in folding groups. | Making a new record from a page of its own, not from a Modal. | PageHeader, Callout, Form, Section, Input, Select, Checkbox, DatePicker, Lookup |
| **GuidedProcessPage** | A process walked one page per step, with every step on a dark panel at the start or end edge of the page. | A process of a few steps done in order, where each step is a page of fields. | GuidedProcess, Form, Callout |
| **ListPage** | A list of records: the bar to find and filter them, the rows themselves, and the pages under them. | A screen that lists records with a search, filters and pages. | Toolbar, Table, Card, Pagination, EmptyState, Skeleton, Callout |
| **RecordPage** | One record: its name and actions at the top, the tabs of what belongs to it, the numbers that matter, and its details in sections. | One record with its details in sections. | PageHeader, Tabs, Callout, Toolbar, Scoreboard, Section, Form, FormDisplay |
| **SettingsPage** | The settings home: a grid of the places people can go from here, each with its own icon and color. | A page whose job is to send people on. | NavTile, Section, Callout |

Each pattern's full contract, with its starting code, is in `contracts/`. The catalog's **Using patterns** page lists them live.

---

## Prompting

The assistant builds exactly what you describe, from the kit. The clearer the screen in your head, the better the screen on the page.

### Before you prompt

- **Know the screen.** What is it for, who uses it, and what they do there? One sentence is enough.
- **Find the pattern.** Look through [Using patterns](#using-patterns) and name the one that fits.
- **Gather the content.** Real column names, fields, actions and a few sample values make a big difference.
- **For anything bigger than one screen, ask for a plan first.** "Advise first, before you change anything" gets you a plan to agree on, not a surprise.

### Start every screen the same way

`/prototype-from-kit` is the kit's **Prototype from kit** skill: a short set of instructions that comes with every copy of the kit, in `.claude/skills/prototype-from-kit`. Typing it at the start of a message tells the assistant to build the screen the kit's way:

1. Look the screen up in the kit's index, `contracts/index.json`.
2. Read only the contracts for the pieces it needs.
3. Use a pattern when one fits the screen, instead of laying it out by hand.
4. Build only from kit components, with the options their contracts list.
5. Stop and ask when the kit is missing something, instead of inventing it.

Begin with the skill, the pattern and one sentence about the screen:

```text
/prototype-from-kit A Contracts list using ListPage inside AppShell, for finance managers who review renewals.
```

### What a good prompt says

1. **The screen and its pattern:** "a RecordPage for an account", not "a page with details".
2. **The content:** columns, fields, sections, tabs, and sample data.
3. **The actions:** which buttons, which one is the strong brand Button (only one), and what each one does.
4. **The states:** empty, loading, error, success messages, validation.
5. **The widths that matter:** "must work on a phone" or "desktop only".
6. **What to leave out:** parts of a screenshot to ignore, or features for later.

### Examples

**A list of records**

Too vague:

```text
Make an invoices page.
```

Clear:

```text
/prototype-from-kit An Invoices list using ListPage inside AppShell.
Columns: Invoice number (a link), Account, Status (Paid, Overdue, Draft as badges), Due date, Amount (right-aligned).
Toolbar: search, filters for Status and Due date, and one strong brand action, New invoice.
20 sample rows, 10 per page. Show the empty state when the filters match nothing.
It must work on a phone.
```

**A form**

Too vague:

```text
Add a form to create a customer.
```

Clear:

```text
/prototype-from-kit A New account page using FormPage.
Sections: Account (Name, required; Type: Customer or Partner; Parent account as a Lookup), Billing (Currency, Billing cycle, Payment terms), Address (two columns).
Save is the one strong brand action; Cancel goes back to the account list.
After saving, go to the account and show a success message.
```

**From a screenshot**

Too vague:

```text
Make it look like this screenshot.
```

Clear:

```text
Here is a screenshot of our current account page. Rebuild it with RecordPage.
Keep the tabs, the summary numbers and the account details.
Ignore the old side menu and the colors; use the kit's.
If something in the screenshot has no kit component, stop and tell me which, before building.
```

### Work in small steps

- **One screen at a time.** Get it right, then move to the next one.
- **One change per message** once the screen exists: "Add a Status filter to the toolbar".
- **Point at the thing.** Select the element on the page, or name the component and where it sits.
- **Say what is wrong and what you want instead,** not only "fix it".
- **Save good states.** Ask the assistant to commit when a screen looks right, so you can always go back.

### When a piece is missing

The kit tells the assistant to stop and ask when a screen needs something it does not have. That is on purpose: it keeps every prototype built from the same parts. You have two good answers:

- **Add it to the kit:** "Add a Rating component to the kit: contract first, then the component, then its catalog page."
- **Change the screen:** "Use a Select with 1 to 5 instead."

> Avoid "just build something quick for this screen". One-off parts drift from the kit and break the next time things change.

### Check the result

- **Ask the assistant to check it in the browser** and show you a screenshot before you review.
- **Try it at phone and tablet widths,** and in dark mode from the top bar.
- **Click through it:** menus open, dialogs close with Escape, forms show errors, buttons do what they say.
- **Ask for a review** when a screen is done: "Review this screen against the kit rules. Report only."

### Keep the kit clean

- Ask for kit components by name, and use only the options their contracts list.
- One strong brand Button per view.
- No colors or spacing typed in by hand: the kit's tokens and layout classes cover them.
- Describe goals, not other products: "a dense table for power users", not "make it like product X".
- Keep secrets out of prompts: no passwords, keys or real customer data.

### Checklist

- [ ] Started with `/prototype-from-kit` and named a pattern.
- [ ] Gave real content: columns, fields, actions, sample data.
- [ ] Said which button is the strong brand one, and which states to show.
- [ ] Said which widths matter.
- [ ] Asked for a plan first on anything bigger than one screen.
- [ ] Checked it in the browser at every width before calling it done.

---

## MCP server (local)

Agents can query this repo's **contracts** (components and screen patterns) and **semantic tokens** without opening every file. The server is read-only stdio MCP: it reads `contracts/` and `src/tokens/source/semantic.txt` at runtime (no duplicated catalog).

### Run it

From a clone of this repo, after `npm install`:

```bash
npm run mcp
```

Or:

```bash
npx agentic-bp-ds-kit mcp
```

(`npx` uses the `bin` entry in this repo's `package.json`; it is not published to npm.)

### Tools

| Tool | Purpose |
| --- | --- |
| `list` | Every component and screen pattern in `contracts/index.json`, split by kind, each with its `level`; optional `level` (`atom`, `molecule`, `organism`, `template`) lists one level only |
| `get` | One component or pattern: full contract, kind, level, usage and import (`name`: `Button`, `button`, `ListPage`) |
| `search` | Match name, tags, intent, `useWhen` and related fields, across components and patterns; each match carries its `level` |
| `get_tokens` | Semantic tokens; optional `category` (e.g. `text`, `background`) and `theme` (`light`, `dark`, `both`) |
| `get_rules` | Kit agent rules plus `CLAUDE.md` / `AGENTS.md` text |
| `review_ui` | Review a screen against the contracts: `path` for a file or folder, or `code` (+ `filename`) for a draft you have not saved yet. Run it before you hand a screen back |

### Cursor

Add to `.cursor/mcp.json` (paths relative to your machine):

```json
{
  "mcpServers": {
    "agentic-bp-ds-kit": {
      "command": "node",
      "args": ["/absolute/path/to/agentic-bp-ds-kit/bin/mcp.mjs"],
      "cwd": "/absolute/path/to/agentic-bp-ds-kit"
    }
  }
}
```

Or use `npm run mcp` via your package manager wrapper if you prefer running through `npm`.

### Claude Code

In `.mcp.json` at the project root (or Claude Code MCP settings):

```json
{
  "mcpServers": {
    "agentic-bp-ds-kit": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/agentic-bp-ds-kit/bin/mcp.mjs"],
      "cwd": "/absolute/path/to/agentic-bp-ds-kit"
    }
  }
}
```

Run `npm test -- tests/mcp.test.ts` to verify each tool responds.

---

## What's in the repo

| Folder | What it holds |
| --- | --- |
| `contracts/` | One JSON contract per component and pattern, plus `index.json` |
| `src/ui/` | Components, one folder each |
| `src/patterns/` | Page blueprints composed from components |
| `src/tokens/` | Primitive and semantic tokens, and layout classes |
| `src/app/(playground)/` | The catalog you see at localhost:3000, including the Start pages |
| `mcp/`, `bin/mcp.mjs` | Local read-only MCP server over contracts and tokens |
| `packages/create-agentic-bp-ds/` | The `npm create` installer |
| `.claude/skills/prototype-from-kit/` | The Prototype from kit skill |
| `CHANGELOG.md` | What changed in each release |
| `RELEASING.md` | How a new version goes out |

## License

MIT
