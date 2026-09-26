import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { routeDates } from "./scripts/routes.mjs";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Each page's datePublished and dateModified for its JSON-LD, read from git
  // history at build time (scripts/routes.mjs), the same dates the sitemap uses.
  define: {
    __PAGE_DATES__: JSON.stringify(routeDates()),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
});
