import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Existing codebase uses `any` liberally — warn until types are tightened
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Config files are CJS; exclude from TS rules
    '.lintstagedrc.js',
    'playwright.config.ts',
    'vitest.config.mts',
  ]),
])

export default eslintConfig
