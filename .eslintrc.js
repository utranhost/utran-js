module.exports = {
    env: {
      browser: true,
      es2021: true
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: 'tsconfig.json'
    },
    extends: 'standard-with-typescript',
    plugins: ['@typescript-eslint'],
    overrides: [
    ],
    rules: {
      "@typescript-eslint/no-this-alias": ["off"],
      "@typescript-eslint/no-dynamic-delete":["off"],
      "@typescript-eslint/no-unused-vars":["off"],
      "@typescript-eslint/no-base-to-string":['off']
    }
  }