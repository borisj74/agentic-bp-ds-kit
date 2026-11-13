# create-agentic-bp-ds

Start a new prototype from the Agentic BP DS kit in one command.

```bash
npm create agentic-bp-ds@latest my-prototype
```

It downloads the kit release that matches the installer's version, installs it, and tells you how to start. Then:

```bash
cd my-prototype
npm run dev
```

Open http://localhost:3000 to browse the catalog. Needs Node 20 or newer.

## Start from a working screen

Add `--template` and the prototype comes with a screen already built, instead of only the catalog:

```bash
npm create agentic-bp-ds@latest my-prototype -- --template dashboard
```

The screen lands at `src/app/dashboard/page.tsx` and opens at http://localhost:3000/dashboard. Use `--route` to put it somewhere else:

```bash
npm create agentic-bp-ds@latest my-prototype -- --template dashboard --route sales
```

The starters are `list`, `record`, `form`, `dashboard`, `list-detail`, `settings`, `guided-process` and `blank`. An unknown name prints the list of real ones. A kit release older than starter pages has none; then the installer says so and carries on without a screen.

Inside a prototype you already have, `npm run new-screen -- --template dashboard --route sales` writes another one.

`@latest` gets the newest release. For an earlier one, name its version, like `npm create agentic-bp-ds@0.2.0 my-prototype`. Releases are listed at https://github.com/borisj74/agentic-bp-ds-kit/tags.

Kit repo: https://github.com/borisj74/agentic-bp-ds-kit
