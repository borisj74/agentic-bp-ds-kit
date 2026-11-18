import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// The library build (npm run build:lib). It turns src/lib/index.ts into dist/: one ESM bundle, one stylesheet and
// the types next to them, so the kit drops into any React app and not only this Next one.
//
// react and react-dom stay external and are peer dependencies: the host app owns them, and two copies of React in
// one page break hooks. The bundle carries one "use client" directive, since nearly every piece uses state or an
// effect, and a host that does use React Server Components needs the whole entry marked as client code.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  // The catalog's public/ folder belongs to the Next app, not to the library bundle.
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
    cssCodeSplit: false,
    lib: {
      entry: "src/lib/index.ts",
      formats: ["es"],
      fileName: () => "index.js",
      cssFileName: "styles",
    },
    rollupOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/],
      output: { banner: '"use client";' },
    },
  },
});
