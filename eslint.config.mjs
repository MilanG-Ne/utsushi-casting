import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "playwright-report/**", "test-results/**", ".lighthouseci/**", "next-env.d.ts"],
  },
  {
    rules: {
      "jsx-a11y/no-noninteractive-tabindex": ["error", { tags: [], roles: ["tabpanel"], allowExpressionValues: true }],
    },
  },
];

export default config;
