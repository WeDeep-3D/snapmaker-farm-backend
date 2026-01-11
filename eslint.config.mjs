import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * ESLint flat config for Bun + Elysia (TypeScript).
 * - Bun/Node globals
 * - JS + TS recommended rules
 * - Light TS ergonomics tuning
 */
export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".idea/**",
    ],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"] ,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.bun,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

