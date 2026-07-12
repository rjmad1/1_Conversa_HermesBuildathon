import tseslintParser from "@typescript-eslint/parser";

export default [
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
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
