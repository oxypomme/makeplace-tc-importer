/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-airbnb-with-typescript',
    '@nuxt/eslint-config',
  ],
  overrides: [
    {
      // allow extraneous dependencies for dev files
      files: ['nuxt.config.ts', '.eslintrc.cjs'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
