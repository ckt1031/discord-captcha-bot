module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'prefer-const': 2,
    'no-unused-vars': 2,
    'no-use-before-define': 2,
    eqeqeq: 2,
  },
}
