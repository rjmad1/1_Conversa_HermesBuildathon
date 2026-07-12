import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.spec.ts"],
    env: {
      ALLOW_DEV_IDENTITY: "true",
    },
  },
});
