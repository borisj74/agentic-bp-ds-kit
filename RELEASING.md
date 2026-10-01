# Releasing

How a new kit version goes out. A release is a git tag; the `npm create` installer downloads the tag that matches its own version.

1. **Pick the version.** Breaking changes (renamed or removed pieces, props or values) bump the middle number (0.4.4 → 0.5.0). Everything else bumps the last number (0.4.4 → 0.4.5).
2. **Write the CHANGELOG entry.** Add a new entry at the top of [CHANGELOG.md](CHANGELOG.md), headed `## v<version> — <YYYY-MM-DD>`. Use the groups Added / Changed / Removed / Breaking, only the ones that apply, in plain everyday language with kit names. For a breaking release, say what to run or change (codemod script, new prop). The Figma task for the same work adds the matching card on the Figma Changelog page.
3. **Bump both versions** to the same number: `version` in the root `package.json` (and the two root lines in `package-lock.json`), and in `packages/create-agentic-bp-ds/package.json`.
4. **Check it builds:** `npm run build`.
5. **Commit** as `Release v<version>: <one-line summary>`.
6. **Tag and push:** `git tag -a v<version>`, then push the commit and the tag. Never publish before the tag is pushed, or new installs fail.
7. **Check the tag download works:** `https://codeload.github.com/borisj74/agentic-bp-ds-kit/tar.gz/refs/tags/v<version>` returns 200.
8. **Publish the installer** from your own terminal (npm asks for a browser sign-in):

   ```bash
   cd packages/create-agentic-bp-ds && npm publish
   ```

   If it answers E404, your npm login has expired: run `npm login`, check `npm whoami`, and publish again. The registry can take a few minutes to show the new version.

A tag that is never published (like v0.3.0) is fine: say so in its CHANGELOG entry.
