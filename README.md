# Agentic BP DS

A code-only design system and playground for prototyping product screens. Tokens, components, patterns and a catalog, built with Next.js, React and CSS Modules. Every piece has a JSON contract, so an AI assistant can build screens from the kit without inventing its own parts.

## Start a prototype

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm create agentic-bp-ds@latest my-prototype
```

This downloads the latest kit into `my-prototype` and installs it. Then:

```bash
cd my-prototype
npm run dev
```

Open http://localhost:3000 to browse the catalog: Foundations, Components and Patterns.

Other ways to get the kit:

- On GitHub, click **Use this template** to make your own copy of the repo.
- Or clone it: `git clone https://github.com/borisj74/agentic-bp-ds-kit.git`

## Build a screen

1. Look up the piece in `contracts/index.json`, then read its contract in `contracts/`.
2. If a pattern fits the screen, import it from `@/patterns/`.
3. Compose kit components from `@/ui/`. Use only the options the contract lists.
4. Use the layout classes in `src/tokens/layout.css` for page spacing, and semantic tokens for colour.

Working with Claude Code? `CLAUDE.md` holds the kit rules, and `/prototype-from-kit <what to build>` walks through the steps above.

## What's inside

| Folder | What it holds |
| --- | --- |
| `contracts/` | One JSON contract per component and pattern, plus `index.json` |
| `src/ui/` | Components, one folder each |
| `src/patterns/` | Page blueprints composed from components |
| `src/tokens/` | Primitive and semantic tokens, and layout classes |
| `src/app/(playground)/` | The catalog you see at localhost:3000 |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the catalog locally |
| `npm run build` | Production build |
| `npm run lint` | Lint |
| `npm run tokens` | Rebuild token CSS from `src/tokens/source` |

## License

MIT
