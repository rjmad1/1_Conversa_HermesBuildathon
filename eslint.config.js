import tseslintParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [".next/**", "dist/**", "node_modules/**", "coverage/**", "api/index.js"],
  },
  {
    files: ["src/**/*.ts", "tests/**/*.ts", "app/**/*.ts", "app/**/*.tsx", "components/**/*.ts", "components/**/*.tsx"],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: { ecmaVersion: 2022, sourceType: "module" },
    },
    rules: {
      // Baseline: parse-only lint. Style/complexity rules intentionally minimal to
      // keep `npm run lint` a syntax+parse gate; deeper rules can be added later.
      "no-unused-vars": "off",
      "no-console": "off",
    },
  },
];
