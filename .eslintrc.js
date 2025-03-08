module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      // Add specific exceptions if needed
      ignoreRestSiblings: true,
    }],
  },
  overrides: [
    {
      // Only apply these rules to UI components
      files: ['**/ui/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-empty-interface': ['error', {
          'allowSingleExtends': true
        }]
      }
    }
  ]
} 