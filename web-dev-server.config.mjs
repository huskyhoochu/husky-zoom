import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  open: false,
  nodeResolve: true,
  appIndex: 'index.html',
  rootDir: '.',
  basePath: '/',
  plugins: [
    esbuildPlugin({
      ts: true,
      target: 'auto',
      define: {
        process: JSON.stringify({
          env: {
            API_KEY: process.env.API_KEY,
            AUTH_DOMAIN: process.env.AUTH_DOMAIN,
            PROJECT_ID: process.env.PROJECT_ID,
            STORAGE_BUCKET: process.env.STORAGE_BUCKET,
            MESSAGING_SENDER_ID: process.env.MESSAGING_SENDER_ID,
            APP_ID: process.env.APP_ID,
            MEASUREMENT_ID: process.env.MEASUREMENT_ID,
          },
        }),
      },
    }),
  ],
  watch: true,
};
