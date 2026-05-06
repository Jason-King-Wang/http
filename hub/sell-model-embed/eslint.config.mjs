import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "out/**",
    "pages-root-check/**",
    "node_modules/**",
    "hub/**",
    "data/**",
    "ai-database/**",
    "resume/**",
    "app.js",
    "service-worker*.js",
    "next-env.d.ts"
  ])
]);
