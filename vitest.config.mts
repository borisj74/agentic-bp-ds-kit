import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// Unit, interaction and accessibility tests for the kit (npm test). They run in jsdom: there is no layout or paint,
// so anything that needs real sizes or colors belongs in a browser test instead.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // CSS modules keep their plain class names, so a test can read a state class like iconOnly.
    css: { include: /.+/, modules: { classNameStrategy: "non-scoped" } },
  },
});
