import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.spec.ts"],
    projects: [
      {
        name: "unit",
        test: { include: ["tests/unit/**/*.spec.ts"] },
      },
      {
        name: "integration",
        test: { include: ["tests/integration/**/*.spec.ts"] },
      },
      {
        name: "e2e",
        test: { include: ["tests/e2e/**/*.spec.ts"] },
      },
    ],
  },
});
