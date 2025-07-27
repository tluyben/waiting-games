import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/waiting-games.js',
        format: 'umd',
        name: 'WaitingGames',
        exports: 'named',
        globals: {
          'react': 'React'
        }
      },
      {
        file: 'dist/waiting-games.esm.js',
        format: 'es'
      }
    ],
    external: ['react'],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src'
      })
    ]
  }
];