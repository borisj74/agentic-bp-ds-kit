import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    // The library build output (npm run build:lib): generated, minified, not source.
    "dist/**",
    "next-env.d.ts",
    // Wrong on purpose: the review's own bad fixtures.
    "tests/fixtures/review/**",
  ]),
]);

export default eslintConfig;
