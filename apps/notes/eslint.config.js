import config from '@defi-notes/config/eslint.config.js';
import mdConfig from '@defi-notes/config/eslint.markdown.config.js';

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  ...mdConfig,
  {
    ignores: ['.astro'],
  },
];
