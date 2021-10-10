import html from '@web/rollup-plugin-html';
import resolve from '@rollup/plugin-node-resolve';
import minifyHTML from 'rollup-plugin-minify-html-literals';
import summary from 'rollup-plugin-summary';
import esbuild from 'rollup-plugin-esbuild'

export default {
  input: 'src/index.ts',
  plugins: [
    esbuild({
      minify: true,
    }),
    html({
      input: 'index.html',
    }),
    resolve(),
    minifyHTML(),
    summary(),
  ],
  output: {
    dir: 'dist/client',
    manualChunks: {
      lit: ['lit'],
      'vaadin-router': ['@vaadin/router'],
    }
  },
  preserveEntrySignatures: 'strict',
}