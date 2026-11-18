import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig(
  { ignores: [".svelte-kit/", ".vercel/", "build/"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: { parserOptions: { projectService: true, extraFileExtensions: [".svelte"], parser: ts.parser } },
  },
  {
    rules: {
      "svelte/no-at-html-tags": "off",
      "svelte/no-navigation-without-resolve": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", ignoreRestSiblings: true }],
    },
  }
);
