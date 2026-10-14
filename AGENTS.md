<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Paper component artboards

The kit's components are also drawn in Paper (file `01M2MJ3E3YE26YTE671TK6B10X`, page "Components"): one 1440-wide artboard per component, A to Z, with Header, Examples, States and anatomy, Props and Usage sections.

Every text node on those artboards, existing and new, uses font tokens, never literals:

- Family: Inter → `var(--font-sans)`, Roboto Mono → `var(--font-mono)`.
- Size: 10 → `--text-overline-size`, 12 → `--font-size-xsmall`, 14 → `--font-size-small`, 16 → `--font-size-regular`, 18 → `--font-size-large`, 20 → `--font-size-xlarge`, 24 → `--font-size-xxlarge`, 26 → `--text-display-size`, 40 (page title) → `--text-page-title-size`.
- Weight: 400 / 500 / 600 / 700 → `--font-weight-regular` / `-medium` / `-semibold` / `-bold`.
- Letter spacing: 0.04em → `--letter-spacing-wide`, 0.08em (the "COMPONENTS ·" overline) → `--letter-spacing-wider`, -0.02em → `--letter-spacing-tight`, 0 → `--letter-spacing-normal`.

`--text-page-title-size` and `--letter-spacing-wider` exist only in the Paper file, for the doc artboards; they are not kit code tokens.

Exceptions: Material Symbols icon glyphs keep their literal family and size. Line height stays in px, since the line-height tokens are percentages and would shift layout. Use a size that has a token (13px labels became 14px); if a new size seems needed, flag it rather than inventing a token.

Write new artboard HTML with these tokens from the start. When you duplicate an older artboard, check it for leftover literals.
