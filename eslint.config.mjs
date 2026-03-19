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
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['supabase/scripts/**'],
    rules: {
      'no-console': 'off',
    },
  },
)
