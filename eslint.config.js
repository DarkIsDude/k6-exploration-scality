import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default [
  js.configs.recommended,
  globalIgnores(['dist/', 'node_modules/', '.yarn/', 'webpack.config.js', 'src/jslib-aws/**', 'eslint.config.js']),
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        console: false,
        __ENV: false,
      },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: tseslint.configs.recommended.rules,
  },
  prettier,
  {
    rules: {
      'no-console': 'off',
    },
  },
];
