// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],
      'vue/no-multiple-template-root': 'off',
      'vue/require-default-prop': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'no-console': ['warn', { allow: ['warn', 'error', 'debug', 'info'] }],
      'prefer-const': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },
  {
    // Layering: components and pages reach data through composables, and analysis through the facade.
    files: ['app/components/**/*.{vue,ts}', 'app/pages/**/*.{vue,ts}'],
    ignores: ['**/*.test.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { regex: '^(~|@)/stores(/|$)', message: 'Components and pages reach stores through composables (app/AGENTS.md).' },
          { regex: '^(~|@)/utils/db(-adapters)?$', message: 'Components and pages do not import Dexie. Use a composable.' },
          { regex: '^(~|@)/utils/seniority-(engine|analysis|api)(/|$)', message: 'Import seniority analysis only from ~/utils/seniority.' },
        ],
      }],
    },
  },
  {
    files: ['supabase/scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },

)
