import { defineConfig } from "vite";

// SPA: single HTML + TS entry. API + UI served from same origin in dev via the Hono app.
export default defineConfig({
  root: "src/ui",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "src/ui/index.html",
    },
  },
  server: { port: 3000 },
});
