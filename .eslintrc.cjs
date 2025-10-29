module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script',
  },
  extends: [
    'eslint:recommended',
    'plugin:n/recommended',
    'plugin:import/recommended',
  ],
  rules: {
    'no-console': 'off',
    'n/no-process-exit': 'off',
    'n/no-unsupported-features/node-builtins': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  ignorePatterns: [
    'node_modules/',
    'client/node_modules/',
    'client/build/',
    'build/',
    'dist/',
    'playwright-report/',
    'html-examples-dont-touch/',
  ],
};