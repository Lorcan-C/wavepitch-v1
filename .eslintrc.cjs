/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: { es2021: true, browser: true, node: true, jest: false },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: false,
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'unused-imports',
    'promise',
    'n',
    'security',
    'unicorn',
    'jsonc',
    'yml',
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:promise/recommended',
    'plugin:n/recommended',
    'plugin:security/recommended',
    'plugin:unicorn/recommended',
    'plugin:jsonc/recommended-with-json',
    'plugin:yml/standard',
    'plugin:prettier/recommended',
  ],
  settings: {
    'import/resolver': { typescript: true, node: true },
  },
  rules: {
    'prettier/prettier': 'error',

    // Keep imports tight & clean
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

    // Import hygiene
    'import/order': ['warn', { 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
    'import/no-unresolved': 'off', // handled by TS

    // Reasonable unicorn tweaks
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/filename-case': 'off',

    // Node rules that are noisy in ESM/TS projects
    'n/no-missing-import': 'off',
    'n/no-unsupported-features/es-syntax': 'off',
  },
  overrides: [
    // JSON & package.json lint
    { files: ['*.json'], parser: 'jsonc-eslint-parser' },
    // YAML lint
    { files: ['*.y?(a)ml'], parser: 'yaml-eslint-parser' },
    // Config files & scripts
    { files: ['*.cjs', '*.js'], env: { node: true } },
    // Test env
    {
      files: ['**/*.{test,spec}.ts', '**/__tests__/**/*.ts', '**/*.{test,spec}.tsx'],
      env: { 'vitest/globals': true },
      plugins: ['vitest'],
      extends: ['plugin:vitest/recommended'],
    },
  ],
};
