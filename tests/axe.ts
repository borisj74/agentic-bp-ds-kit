import axe from "axe-core";

// Runs axe over what a test rendered and returns one readable line per problem, so a failing test says what to fix.
// Portaled pieces (menus, dialogs, toasts) live on document.body, so that is the default root.
export async function axeViolations(root: Element = document.body): Promise<string[]> {
  const result = await axe.run(root, {
    rules: {
      // jsdom does not paint, so contrast cannot be measured here.
      "color-contrast": { enabled: false },
      // A component rendered on its own is not a whole page: no landmarks or page heading are expected.
      region: { enabled: false },
      "landmark-one-main": { enabled: false },
      "page-has-heading-one": { enabled: false },
    },
  });
  return result.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help} at ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`,
  );
}
