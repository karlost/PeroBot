import antfu from '@antfu/eslint-config'

export default antfu(
  {
    unocss: true,
    formatters: true,
    rules: {
      'no-cond-assign': 'off',
      'no-sequences': 'off',
    },
  },
)
