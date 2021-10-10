import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  open: false,
  nodeResolve: true,
  appIndex: 'index.html',
  rootDir: '.',
  basePath: '/',
  plugins: [esbuildPlugin({ ts: true, target: 'auto' })],
  watch: true,
};
