const esbuild = require('esbuild');

esbuild.build({
  minify: true,
  entryPoints: ['server/index.ts'],
  bundle: true,
  outdir: 'dist/server',
  platform: 'node',
  tsconfig: 'tsconfig.server.json',
  loader: {
    '.ts': 'ts'
  }
}).catch(() => process.exit(1));
