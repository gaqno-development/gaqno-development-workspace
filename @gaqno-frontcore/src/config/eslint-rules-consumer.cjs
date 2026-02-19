/**
 * Shared ESLint rules for apps that consume frontcore.
 * Use in .eslintrc.cjs: rules: { ...require("@gaqno-development/frontcore/config/eslint-rules-consumer").rules }
 * Single source of truth: import UI from frontcore, never from @radix-ui in app code.
 */
module.exports = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@radix-ui/*"],
            message:
              "Import UI from @gaqno-development/frontcore/components/ui or @/components/ui, not from @radix-ui directly.",
          },
        ],
      },
    ],
  },
};
