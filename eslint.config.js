import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["outputs/**", "node_modules/**", "web/public/**"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrors: "none",
          varsIgnorePattern: "^[A-Z]",
        },
      ],
      "no-constant-binary-expression": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      eqeqeq: ["error", "always", { null: "ignore" }],
    },
  },
  {
    files: ["web/src/**/*.{js,jsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" },
        { blankLine: "always", prev: "*", next: "export" },
        { blankLine: "always", prev: "export", next: "*" },
        { blankLine: "always", prev: "*", next: "function" },
        { blankLine: "always", prev: "function", next: "*" },
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: "*", next: "try" },
        {
          blankLine: "always",
          prev: ["const", "let"],
          next: ["if", "for", "while", "try"],
        },
        {
          blankLine: "always",
          prev: ["if", "for", "while", "try"],
          next: ["const", "let"],
        },
      ],
    },
  },
];
