import globals from 'globals';
import pluginJs from '@eslint/js';
import ts_eslint from 'typescript-eslint';

export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...ts_eslint.configs.recommended,
];
