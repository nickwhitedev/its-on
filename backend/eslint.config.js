import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },

    extends: compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/strict-type-checked',
      'plugin:@typescript-eslint/stylistic-type-checked',
    ),

    rules: {
      'no-unused-vars': 'off',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },

    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  globalIgnores([
    '**/.eslintrc.js',
    '**/eslint.config.js',
    'coverage',
    '.aws-sam',
    'dist',
  ]),
])
