import terser from '@rollup/plugin-terser'

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'es',
    name: 'CacheManager',
  },
  plugins: [terser()],
}
