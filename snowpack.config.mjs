// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
export default {
  mount: {
    src: '/',
    public: '/',
  },
  plugins: [
    /* ... */
    '@snowpack/plugin-dotenv',
  ],
  packageOptions: {
    /* ... */
  },
  devOptions: {
    polyfillNode: true,
    /* ... */
  },
  buildOptions: {
    /* ... */
    out: 'dist/client',
  },
  alias: {
    '@components': './src/components',
    '@config': './src/config',
    '@fetcher': './src/fetcher',
    '@pages': './src/pages',
    '@styles': './src/styles',
    '@types': './src/types',
    '@app': './src/index',
  },
};
