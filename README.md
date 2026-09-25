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
- **Contracts:** one file per piece that says what it is for, its options and what not to do. The assistant reads these before it builds.
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
| `npm run build` | Checks that everything builds, as it would before deploying |
| `npm run lint` | Checks the code for common mistakes |
| `npm test` | Runs the unit, interaction and accessibility tests |
| `npm run test:watch` | Reruns the tests as files change |
| `npm run tokens` | Rebuilds the token CSS after editing `src/tokens/source` |

### Work with the assistant

Open the prototype folder in your AI coding assistant. The rules come with the kit, so there is nothing to set up:

- `CLAUDE.md` holds the kit rules the assistant follows on every request.
- `/prototype-from-kit` runs the **Prototype from kit** skill, which walks the assistant through building a screen from the kit.
- `contracts/` tells it what each piece is for and which options it has.

Read [Prompting](#prompting) before your first screen.

### Getting updates

> **Prototypes do not update on their own.** Each prototype is a copy of the kit from the day it was made. To use newer components, start a new prototype with Option 1 and move your screens across.

Working from a clone of the kit (Option 3)? Run `git pull` and then `npm install`.

Some releases rename pieces or props. When you move screens into a newer kit, run the matching script over your screen folders, oldest first, then `npx tsc --noEmit` to catch anything it missed. Each script is safe to run twice.

| Script | What it renames |
| --- | --- |
| `node scripts/codemod-a2-rulings.mjs src/app` | `tone` to `intent` |
| `node scripts/codemod-a3-renames.mjs src/app` | Alert to Callout, Empty to EmptyState, Progress to Meter, ProgressLegacy to ProgressBar, ButtonFilter to FilterButton, SegmentedControl to Segmented, Stepper to Steps, DropdownMenu to Dropdown, ShimmerText to TextLoader, Command to GlobalSearch, Tile to NavTile, SideNav to AppNav, and the props that moved with them |

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
3. **The actions:** which buttons, which one is primary (only one), and what each one does.
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
Toolbar: search, filters for Status and Due date, and one primary action, New invoice.
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
Save is the one primary action; Cancel goes back to the account list.
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
- One primary button per view.
- No colors or spacing typed in by hand: the kit's tokens and layout classes cover them.
- Describe goals, not other products: "a dense table for power users", not "make it like product X".
- Keep secrets out of prompts: no passwords, keys or real customer data.

### Checklist

- [ ] Started with `/prototype-from-kit` and named a pattern.
- [ ] Gave real content: columns, fields, actions, sample data.
- [ ] Said which button is primary, and which states to show.
- [ ] Said which widths matter.
- [ ] Asked for a plan first on anything bigger than one screen.
- [ ] Checked it in the browser at every width before calling it done.

---

## What's in the repo

| Folder | What it holds |
| --- | --- |
| `contracts/` | One JSON contract per component and pattern, plus `index.json` |
| `src/ui/` | Components, one folder each |
| `src/patterns/` | Page blueprints composed from components |
| `src/tokens/` | Primitive and semantic tokens, and layout classes |
| `src/app/(playground)/` | The catalog you see at localhost:3000, including the Start pages |
| `packages/create-agentic-bp-ds/` | The `npm create` installer |
| `.claude/skills/prototype-from-kit/` | The Prototype from kit skill |

## License

MIT
