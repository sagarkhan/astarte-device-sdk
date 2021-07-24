module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-base',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
      {
        usePrettierrc: true,
      },
    ],
    '@typescript-eslint/indent': ['error', 2],
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'class-methods-use-this': 'off',
    'import/prefer-default-export': 'off',
    'no-async-promise-executor': 'off',
    'lines-between-class-members': 'off',
    'no-await-in-loop': 'off',
    camelcase: 'off',
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
  },
};
