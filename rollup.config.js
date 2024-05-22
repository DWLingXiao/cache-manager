import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'

const config = [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/bundle.js',
      format: 'es',
      name: 'CacheManager',
    },
    plugins: [typescript(), terser()],
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/bundle.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
]

export default config
