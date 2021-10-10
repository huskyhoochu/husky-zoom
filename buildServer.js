const esbuild = require('esbuild');

esbuild.build({
  minify: true,
  entryPoints: ['server/index.ts'],
  bundle: true,
  outdir: 'build',
  platform: 'node',
  tsconfig: 'tsconfig.server.json',
  external: ['http', 'express', 'compression'],
  loader: {
    '.ts': 'ts'
  }
}).catch(() => process.exit(1));
