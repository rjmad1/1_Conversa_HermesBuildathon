import { defineConfig } from "vite";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

let commitSha = process.env.VERCEL_GIT_COMMIT_SHA || "";
if (!commitSha) {
  try {
    commitSha = execSync("git rev-parse --short HEAD").toString().trim();
  } catch (e) {
    commitSha = "dev";
  }
} else {
  commitSha = commitSha.substring(0, 7);
}

let version = "0.3.0";
try {
  const pkg = JSON.parse(readFileSync("./package.json", "utf8"));
  version = pkg.version || "0.3.0";
} catch (e) {}

process.env.VITE_GIT_COMMIT_SHA = commitSha;
process.env.VITE_APP_VERSION = version;

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
